import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma for Vercel serverless environment
const prismaOptions = {
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL!
    }
  }
}

// Create Prisma client with connection pooling for serverless
export const db =
  globalForPrisma.prisma ??
  new PrismaClient(prismaOptions)

// Ensure connection is reused in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Helper function to test database connection
export async function testDatabaseConnection() {
  try {
    await db.$connect()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Helper function to handle database operations with retry
export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Handle prepared statement conflicts
      if (error instanceof Error && error.message.includes('prepared statement')) {
        console.warn(`Prepared statement conflict, retry ${i + 1}/${retries}`)
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
        continue
      }
      
      // Re-throw other errors
      throw error
    }
  }
  
  throw lastError
}
