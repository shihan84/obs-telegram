const axios = require('axios');

const BASE_URL = process.env.DEPLOYMENT_URL || 'https://obs-telegram.vercel.app';

async function testBotDeployment() {
  console.log('🧪 Testing Telegram Bot Deployment...');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing health check...');
    const health = await axios.get(`${BASE_URL}/api/bot/health`);
    console.log('✅ Health check:', health.data);
    
    // 2. Test bot configuration
    console.log('2. Testing bot configuration...');
    const config = await axios.get(`${BASE_URL}/api/bot/setup-manual`);
    console.log('✅ Bot config:', config.data);
    
    // 3. Test database connection
    console.log('3. Testing database connection...');
    const dbCheck = await axios.get(`${BASE_URL}/api/db-check`);
    console.log('✅ Database check:', dbCheck.data);
    
    // 4. Test diagnostics
    console.log('4. Testing diagnostics...');
    const diagnostics = await axios.get(`${BASE_URL}/api/diagnostics`);
    console.log('✅ Diagnostics:', diagnostics.data);
    
    console.log('\n🎉 All tests passed! Bot is ready for configuration.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if deployment URL is correct');
    console.log('2. Verify environment variables in Vercel');
    console.log('3. Check Vercel logs for specific errors');
    console.log('4. Run: npm run build && vercel --prod');
  }
}

// Run tests
testBotDeployment();
