const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function configureBot() {
  try {
    console.log('Configuring Telegram bot in database...');
    
    // Update or create bot configuration
    const botConfig = await prisma.botConfiguration.upsert({
      where: { id: 1 },
      update: { 
        botToken: '7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI',
        botUsername: 'OBSControlBot',
        welcomeMessage: 'Welcome to OBS Control Bot! 🎥\n\nUse /help to see available commands.',
        isWebhookEnabled: false
      },
      create: { 
        botToken: '7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI',
        botUsername: 'OBSControlBot',
        welcomeMessage: 'Welcome to OBS Control Bot! 🎥\n\nUse /help to see available commands.',
        isWebhookEnabled: false
      }
    });

    console.log('✅ Bot configuration updated successfully!');
    console.log('Bot Token:', botConfig.botToken.substring(0, 20) + '...');
    console.log('Bot Username:', botConfig.botUsername);
    
  } catch (error) {
    console.error('❌ Error configuring bot:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

configureBot();