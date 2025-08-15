// Database configuration for Vercel serverless environment
const config = {
  // Prisma configuration for serverless
  prisma: {
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || process.env.POSTGRES_URL
      }
    }
  },
  
  // Connection pooling settings
  connection: {
    max_connections: 10,
    connection_timeout: 30,
    pool_timeout: 30
  },
  
  // Retry settings for prepared statement conflicts
  retry: {
    max_retries: 3,
    retry_delay: 100
  }
}

module.exports = config
