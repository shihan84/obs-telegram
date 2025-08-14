import { TelegramBotService } from './bot.service';
import { db } from '@/lib/db';

export class BotManager {
  private static instance: BotManager;
  private botService: TelegramBotService | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager();
    }
    return BotManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Get bot configuration from database
      const botConfig = await db.botConfiguration.findFirst();
      
      if (!botConfig || !botConfig.botToken) {
        console.warn('Bot token not configured. Please set up bot configuration in the database.');
        return;
      }

      // Create bot service
      this.botService = new TelegramBotService(botConfig.botToken);
      
      // Start the bot
      await this.botService.start();
      this.isRunning = true;
      
      console.log('Bot manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize bot manager:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.botService && this.isRunning) {
      try {
        await this.botService.stop();
        this.isRunning = false;
        console.log('Bot manager stopped successfully');
      } catch (error) {
        console.error('Failed to stop bot manager:', error);
        throw error;
      }
    }
  }

  public isBotRunning(): boolean {
    return this.isRunning;
  }

  public getBotService(): TelegramBotService | null {
    return this.botService;
  }

  public async restart(): Promise<void> {
    await this.stop();
    await this.initialize();
  }

  public async updateBotToken(token: string): Promise<void> {
    try {
      // Update or create bot configuration
      await db.botConfiguration.upsert({
        where: { id: 1 },
        update: { botToken: token },
        create: { 
          botToken: token,
          botUsername: 'OBSControlBot',
          welcomeMessage: 'Welcome to OBS Control Bot! 🎥\n\nUse /help to see available commands.'
        }
      });

      // Restart bot if running
      if (this.isRunning) {
        await this.restart();
      }

      console.log('Bot token updated successfully');
    } catch (error) {
      console.error('Failed to update bot token:', error);
      throw error;
    }
  }
}