const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Simple query result:', result);
    
    // Test table existence
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('bot_configurations', 'obs_connections')
        LIMIT 5
      `;
      console.log('Tables found:', tables);
    } catch (tableError) {
      console.log('Table query error:', tableError.message);
    }
    
    console.log('Database connection test completed successfully');
  } catch (error) {
    console.error('Database connection test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();