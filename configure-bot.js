const TELEGRAM_BOT_TOKEN = '7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI';

// Function to configure the bot token via API
async function configureBotToken() {
  try {
    console.log('Configuring Telegram bot token...');
    
    const response = await fetch('http://localhost:3000/api/bot/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botToken: TELEGRAM_BOT_TOKEN
      })
    });

    if (response.ok) {
      console.log('✅ Bot token configured successfully!');
      
      // Start the bot
      console.log('Starting the bot...');
      const startResponse = await fetch('http://localhost:3000/api/bot/start', {
        method: 'POST'
      });
      
      if (startResponse.ok) {
        console.log('✅ Bot started successfully!');
        console.log('🤖 Your OBS Control Bot is now active on Telegram!');
        console.log('📱 You can now interact with your bot using the following commands:');
        console.log('   /start - Welcome message');
        console.log('   /help - Show available commands');
        console.log('   /status - Show bot and OBS status');
        console.log('   /connect - Connect to OBS Studio');
        console.log('   /scenes - List all scenes');
        console.log('   /stream start - Start streaming');
        console.log('   /stream stop - Stop streaming');
        console.log('   /record start - Start recording');
        console.log('   /record stop - Stop recording');
        console.log('   /mute <source> - Mute audio source');
        console.log('   /unmute <source> - Unmute audio source');
        console.log('   /scene <name> - Switch to scene');
        console.log('   /toggle <source> - Toggle source visibility');
        console.log('');
        console.log('🔧 Admin commands:');
        console.log('   /admin <user_id> - Make user admin');
        console.log('   /users - List all users');
      } else {
        console.error('❌ Failed to start the bot');
      }
    } else {
      const error = await response.json();
      console.error('❌ Failed to configure bot token:', error.error);
    }
  } catch (error) {
    console.error('❌ Error configuring bot token:', error.message);
  }
}

// Wait a moment for the server to be ready
setTimeout(configureBotToken, 2000);