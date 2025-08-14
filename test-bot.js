const { Telegraf } = require('telegraf');

const botToken = '7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI';

async function testBot() {
  console.log('Testing Telegram bot...');
  console.log('Bot token:', botToken.substring(0, 10) + '...');
  
  try {
    const bot = new Telegraf(botToken, {
      handlerTimeout: 10000,
      telegram: {
        webhookReply: false
      }
    });
    
    // Simple command handler
    bot.command('test', (ctx) => {
      console.log('Received /test command from:', ctx.from?.username || ctx.from?.first_name);
      ctx.reply('Bot is working! 🎉');
    });
    
    bot.command('start', (ctx) => {
      console.log('Received /start command from:', ctx.from?.username || ctx.from?.first_name);
      ctx.reply('Welcome to OBS Control Bot! 🎥\n\nThis is a test message.');
    });
    
    // Error handler
    bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx.reply('An error occurred.');
    });
    
    console.log('Getting bot info...');
    const botInfo = await bot.telegram.getMe();
    console.log('Bot info:', botInfo);
    
    console.log('Launching bot in polling mode...');
    await bot.launch({
      polling: {
        timeout: 5,
        limit: 10,
        dropPendingUpdates: true,
        interval: 1000
      }
    });
    
    console.log('✅ Bot started successfully!');
    console.log('🤖 Bot username:', botInfo.username);
    console.log('📱 Send /test to @obsassistbot to test it');
    
    // Test a simple API call
    console.log('Testing API call...');
    try {
      const updates = await bot.telegram.getUpdates({ limit: 1, timeout: 5 });
      console.log('Updates received:', updates.length);
    } catch (error) {
      console.log('Get updates error (expected):', error.message);
    }
    
    // Stop after a few seconds for testing
    setTimeout(async () => {
      console.log('Stopping bot after test...');
      await bot.stop();
      process.exit(0);
    }, 10000);
    
    // Keep the bot running
    process.once('SIGINT', () => {
      console.log('Stopping bot...');
      bot.stop('SIGINT');
    });
    
    process.once('SIGTERM', () => {
      console.log('Stopping bot...');
      bot.stop('SIGTERM');
    });
    
  } catch (error) {
    console.error('❌ Error starting bot:', error.message);
    console.error('Full error:', error);
    console.error('Stack:', error.stack);
  }
}

testBot();