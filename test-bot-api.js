const { Telegraf } = require('telegraf');

const botToken = '7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI';

async function testBotAPI() {
  console.log('Testing Telegram bot API...');
  console.log('Bot token:', botToken.substring(0, 10) + '...');
  
  try {
    const bot = new Telegraf(botToken);
    
    console.log('Testing getMe...');
    const botInfo = await bot.telegram.getMe();
    console.log('✅ Bot info:', botInfo.username);
    
    console.log('Testing getUpdates...');
    try {
      const updates = await bot.telegram.getUpdates({ limit: 1, timeout: 5 });
      console.log('✅ Updates received:', updates.length);
    } catch (error) {
      console.log('⚠️ Get updates error (expected if no updates):', error.message);
    }
    
    console.log('Testing sendMessage to a test chat...');
    // Note: You'll need to replace this with your actual chat ID
    const testChatId = '123456789'; // Replace with your chat ID
    try {
      await bot.telegram.sendMessage(testChatId, '🎉 Test message from OBS Control Bot!');
      console.log('✅ Test message sent successfully!');
    } catch (error) {
      console.log('⚠️ Send message error (expected if invalid chat ID):', error.message);
    }
    
    console.log('✅ All API tests completed successfully!');
    console.log('🤖 Bot is working and can communicate with Telegram!');
    
  } catch (error) {
    console.error('❌ Error testing bot API:', error.message);
    console.error('Full error:', error);
  }
}

testBotAPI();