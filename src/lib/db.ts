import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    // Configure for Vercel serverless environment
    datasources: {
      db: {
        url: process.env.DATABASE_URL || process.env.POSTGRES_URL!
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db