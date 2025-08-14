#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Use this to test your database connection string locally before updating Vercel
 */

const { PrismaClient } = require('@prisma/client');

// Test connection strings - replace with your actual credentials
const connectionStrings = [
  // Option A: Recommended format
  'postgresql://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
  
  // Option B: Alternative format
  'postgresql://postgres.wJxY2fQO2foE96MQ@omxmgdmzdukhlnceqock.aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
  
  // Option C: postgres:// protocol
  'postgres://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
];

async function testConnection(connectionString, index) {
  console.log(`\n🔍 Testing Connection Option ${index + 1}:`);
  console.log(`📋 Connection String: ${connectionString.replace(/wJxY2fQO2foE96MQ@/, '***@')}`);
  
  try {
    // Create Prisma client with this connection string
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });

    // Test connection
    console.log('⏳ Connecting to database...');
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Connection successful!');
    
    // Test tables
    console.log('🔍 Testing database tables...');
    const tables = ['telegram_users', 'bot_configurations', 'obs_connections', 'scenes', 'sources', 'command_histories', 'stream_sessions'];
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ✅ ${table}: OK (${result[0].count} records)`);
      } catch (error) {
        console.log(`  ⚠️  ${table}: Table may not exist yet (${error.message})`);
      }
    }
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Database Connection Test Script');
  console.log('=====================================');
  
  let successfulConnection = null;
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], i);
    if (success) {
      successfulConnection = connectionStrings[i];
      break;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  if (successfulConnection) {
    console.log('✅ SUCCESS: Found working connection string!');
    console.log('📝 Use this in your Vercel environment variables:');
    console.log(`\nDATABASE_URL=${successfulConnection}\n`);
    
    console.log('🔧 Next steps:');
    console.log('1. Go to Vercel Dashboard → obs-telegram project → Settings → Environment Variables');
    console.log('2. Update DATABASE_URL with the connection string above');
    console.log('3. Save and wait for redeployment (5-10 minutes)');
    console.log('4. Test at https://obs-telegram.vercel.app/api/diagnostics');
    
  } else {
    console.log('❌ FAILED: None of the connection strings worked');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Supabase project is active');
    console.log('2. Verify your database password is correct');
    console.log('3. Ensure connection pooling is enabled in Supabase');
    console.log('4. Check if your IP is whitelisted (if testing locally)');
    console.log('\n📞 Get your correct connection string from:');
    console.log('   Supabase Dashboard → Settings → Database → Connection string');
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);