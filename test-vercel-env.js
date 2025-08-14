#!/usr/bin/env node

/**
 * Test script to verify Vercel environment variables configuration
 * This simulates how the application will run in Vercel with the new environment variables
 */

// Simulate Vercel environment variables
process.env.POSTGRES_URL = 'postgresql://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true';
process.env.DATABASE_URL = 'postgresql://postgres.wJxY2fQO2foE96MQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true';
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

const { PrismaClient } = require('@prisma/client');

async function testConfiguration() {
  console.log('🚀 Testing Vercel Environment Configuration');
  console.log('==========================================');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`  POSTGRES_URL: ${process.env.POSTGRES_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  VERCEL: ${process.env.VERCEL ? '✅ Yes' : '❌ No'}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  
  // Test Prisma configuration
  console.log('\n🔍 Testing Prisma Configuration:');
  try {
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('⏳ Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!');
    
    // Test environment validation
    console.log('\n🔍 Testing Environment Validation:');
    const { validateEnv } = require('./src/lib/env');
    const isValid = validateEnv();
    console.log(`Environment validation: ${isValid ? '✅ Passed' : '❌ Failed'}`);
    
    // Test tables
    console.log('\n🔍 Testing Database Tables:');
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
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log('✅ Configuration test completed successfully!');
    console.log('📝 Your application should work in Vercel with the current environment variables.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if POSTGRES_URL is correctly set in Vercel');
    console.log('2. Verify your Supabase project is accessible');
    console.log('3. Ensure the database password is correct');
    
    return false;
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

testConfiguration().catch(console.error);