import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { db } from '@/lib/db';
import { OBSManager } from '@/lib/obs/obs.manager';
import { CommandHistory } from '@prisma/client';

export interface BotContext extends Context {
  state?: {
    userId?: number;
    isAdmin?: boolean;
  };
}

export class TelegramBotService {
  private bot: Telegraf<BotContext>;
  private botToken: string;
  private obsManager: OBSManager;

  constructor(botToken: string) {
    this.botToken = botToken;
    this.bot = new Telegraf<BotContext>(botToken);
    this.obsManager = OBSManager.getInstance();
    this.setupMiddleware();
    this.setupCommands();
    this.setupHandlers();
  }

  private setupMiddleware() {
    // State middleware
    this.bot.use(async (ctx, next) => {
      if (!ctx.state) {
        ctx.state = {};
      }
      
      if (ctx.from) {
        const user = await db.telegramUser.findUnique({
          where: { telegramId: BigInt(ctx.from.id) }
        });
        
        if (user) {
          ctx.state.userId = user.id;
          ctx.state.isAdmin = user.isAdmin;
        } else {
          // Create new user
          const newUser = await db.telegramUser.create({
            data: {
              telegramId: BigInt(ctx.from.id),
              username: ctx.from.username,
              firstName: ctx.from.first_name,
              lastName: ctx.from.last_name,
              isBot: ctx.from.is_bot
            }
          });
          ctx.state.userId = newUser.id;
          ctx.state.isAdmin = newUser.isAdmin;
        }
      }
      
      return next();
    });
  }

  private setupCommands() {
    // Basic commands
    this.bot.command('start', this.handleStart.bind(this));
    this.bot.command('help', this.handleHelp.bind(this));
    this.bot.command('status', this.handleStatus.bind(this));
    
    // Admin commands
    this.bot.command('admin', this.handleAdmin.bind(this));
    this.bot.command('users', this.handleUsers.bind(this));
    
    // OBS Control commands
    this.bot.command('connect', this.handleConnect.bind(this));
    this.bot.command('disconnect', this.handleDisconnect.bind(this));
    this.bot.command('scenes', this.handleScenes.bind(this));
    this.bot.command('sources', this.handleSources.bind(this));
    this.bot.command('scene', this.handleScene.bind(this));
    this.bot.command('stream', this.handleStream.bind(this));
    this.bot.command('record', this.handleRecord.bind(this));
    this.bot.command('mute', this.handleMute.bind(this));
    this.bot.command('unmute', this.handleUnmute.bind(this));
    this.bot.command('toggle', this.handleToggle.bind(this));
    
    // Media Source Control commands
    this.bot.command('play', this.handlePlayMedia.bind(this));
    this.bot.command('pause', this.handlePauseMedia.bind(this));
    this.bot.command('restart', this.handleRestartMedia.bind(this));
    this.bot.command('stopmedia', this.handleStopMedia.bind(this));
    this.bot.command('next', this.handleNextMedia.bind(this));
    this.bot.command('previous', this.handlePreviousMedia.bind(this));
    this.bot.command('mediastatus', this.handleMediaStatus.bind(this));
  }

  private setupHandlers() {
    // Handle text messages
    this.bot.on(message('text'), this.handleText.bind(this));
    
    // Handle errors
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx.reply('An error occurred while processing your request.');
    });
  }

  private async logCommand(ctx: BotContext, command: string, parameters?: string, response?: string, status: string = 'pending', executionTime?: number) {
    try {
      await db.commandHistory.create({
        data: {
          command,
          parameters,
          response,
          status,
          executionTime,
          telegramUserId: ctx.state?.userId
        }
      });
    } catch (error) {
      console.error('Error logging command:', error);
    }
  }

  private async handleStart(ctx: BotContext) {
    const startTime = Date.now();
    const welcomeMessage = 'Welcome to OBS Control Bot! 🎥\n\n' +
      'This bot allows you to control OBS Studio remotely via Telegram.\n\n' +
      'Use /help to see available commands.\n' +
      'Use /connect to connect to OBS Studio.';

    await ctx.reply(welcomeMessage);
    
    const executionTime = Date.now() - startTime;
    await this.logCommand(ctx, 'start', undefined, welcomeMessage, 'success', executionTime);
  }

  private async handleHelp(ctx: BotContext) {
    const startTime = Date.now();
    const helpMessage = `📚 *OBS Control Bot Help*

*Basic Commands:*
/start - Welcome message
/help - Show this help message
/status - Show bot and OBS status

*OBS Control Commands:*
/connect - Connect to OBS Studio
/disconnect - Disconnect from OBS Studio
/scenes - List all scenes
/sources - List all sources in current scene
/scene <name> - Switch to scene
/stream <start|stop> - Start/stop streaming
/record <start|stop> - Start/stop recording
/mute <source> - Mute audio source
/unmute <source> - Unmute audio source
/toggle <source> - Toggle source visibility

*Media Source Control Commands:*
/play <source> - Play media source
/pause <source> - Pause media source
/restart <source> - Restart media source
/stopmedia <source> - Stop media source
/next <source> - Play next media in source
/previous <source> - Play previous media in source
/mediastatus <source> - Get media source status

*Admin Commands:*
/admin <user_id> - Make user admin
/users - List all users

*Examples:*
/scene Camera
/stream start
/mute Microphone
/play "Intro Video"
/pause "Background Music"
/restart "Commercial"
/next "Playlist"
/mediastatus "Video Player"

*Legend:*
👁️ = Visible source  🚫 = Hidden source
🔊 = Unmuted audio  🔇 = Muted audio
🎵 = Media source   📺 = Regular source`;

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    
    const executionTime = Date.now() - startTime;
    await this.logCommand(ctx, 'help', undefined, helpMessage, 'success', executionTime);
  }

  private async handleStatus(ctx: BotContext) {
    const startTime = Date.now();
    
    try {
      // Get bot status
      const botConfig = await db.botConfiguration.findFirst();
      const userCount = await db.telegramUser.count();
      const activeUsers = await db.telegramUser.count({ where: { isActive: true } });
      
      // Get OBS connection status
      const obsConnections = await db.oBSConnection.findMany();
      
      let statusMessage = `🤖 *Bot Status:*
- Users: ${userCount} total, ${activeUsers} active
- Bot Token: ${botConfig ? 'Configured' : 'Not configured'}

📺 *OBS Connections:*
`;
      
      if (obsConnections.length === 0) {
        statusMessage += '- No OBS connections configured';
      } else {
        obsConnections.forEach(conn => {
          statusMessage += `- ${conn.name}: ${conn.is_connected ? 'Connected' : 'Disconnected'}\n`;
        });
      }

      await ctx.reply(statusMessage, { parse_mode: 'Markdown' });
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'status', undefined, statusMessage, 'success', executionTime);
    } catch (error) {
      const errorMessage = 'Error getting status';
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'status', undefined, errorMessage, 'error');
    }
  }

  private async handleAdmin(ctx: BotContext) {
    const startTime = Date.now();
    
    if (!ctx.state?.isAdmin) {
      await ctx.reply('⚠️ Admin access required.');
      return;
    }

    const args = ctx.message?.text?.split(' ');
    if (!args || args.length < 2) {
      await ctx.reply('Usage: /admin <user_id>');
      return;
    }

    const userId = parseInt(args[1]);
    if (isNaN(userId)) {
      await ctx.reply('Invalid user ID.');
      return;
    }

    try {
      const user = await db.telegramUser.findUnique({
        where: { id: userId }
      });

      if (!user) {
        await ctx.reply('User not found.');
        return;
      }

      await db.telegramUser.update({
        where: { id: userId },
        data: { isAdmin: !user.isAdmin }
      });

      await ctx.reply(`✅ User ${user.username || user.firstName} admin status ${!user.isAdmin ? 'enabled' : 'disabled'}.`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'admin', args[1], `Admin status toggled for user ${userId}`, 'success', executionTime);
    } catch (error) {
      const errorMessage = 'Error updating admin status';
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'admin', args[1], errorMessage, 'error');
    }
  }

  private async handleUsers(ctx: BotContext) {
    const startTime = Date.now();
    
    if (!ctx.state?.isAdmin) {
      await ctx.reply('⚠️ Admin access required.');
      return;
    }

    try {
      const users = await db.telegramUser.findMany({
        orderBy: { created_at: 'desc' }
      });

      let usersMessage = '👥 *Registered Users:*\n\n';
      users.forEach(user => {
        usersMessage += `${user.isAdmin ? '👑' : '👤'} ${user.username || user.firstName || 'Unknown'} (ID: ${user.id})\n`;
        usersMessage += `  Active: ${user.isActive ? 'Yes' : 'No'}\n\n`;
      });

      await ctx.reply(usersMessage, { parse_mode: 'Markdown' });
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'users', undefined, usersMessage, 'success', executionTime);
    } catch (error) {
      const errorMessage = 'Error fetching users';
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'users', undefined, errorMessage, 'error');
    }
  }

  private async handleConnect(ctx: BotContext) {
    const startTime = Date.now();
    
    try {
      // Check if there are any OBS connections configured
      const connections = await db.oBSConnection.findMany();
      
      if (connections.length === 0) {
        // Create a default connection
        const connectionId = await this.obsManager.addConnection(
          'Default OBS',
          'localhost',
          4455
        );
        
        await this.obsManager.connect(connectionId);
        await ctx.reply('✅ Created default OBS connection and connected successfully!');
      } else {
        // Connect to the default or first connection
        await this.obsManager.connect();
        await ctx.reply('✅ Connected to OBS successfully!');
      }
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'connect', undefined, 'Connected to OBS', 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to connect to OBS: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'connect', undefined, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleDisconnect(ctx: BotContext) {
    const startTime = Date.now();
    
    try {
      await this.obsManager.disconnect();
      await ctx.reply('✅ Disconnected from OBS successfully!');
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'disconnect', undefined, 'Disconnected from OBS', 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to disconnect from OBS: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'disconnect', undefined, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleScenes(ctx: BotContext) {
    const startTime = Date.now();
    
    try {
      const scenes = await this.obsManager.getSceneList();
      
      if (scenes.length === 0) {
        await ctx.reply('🎬 No scenes found in OBS.');
        return;
      }

      let sceneList = '🎬 *Available Scenes:*\n\n';
      scenes.forEach((scene, index) => {
        sceneList += `${index + 1}. ${scene.sceneName}\n`;
      });

      await ctx.reply(sceneList, { parse_mode: 'Markdown' });
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'scenes', undefined, sceneList, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to get scenes: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'scenes', undefined, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleSources(ctx: BotContext) {
    const startTime = Date.now();
    
    try {
      const sources = await this.obsManager.getSourceList();
      
      if (sources.length === 0) {
        await ctx.reply('🎥 No sources found in current scene.');
        return;
      }

      let sourceList = '🎥 *Sources in Current Scene:*\n\n';
      sources.forEach((source, index) => {
        const visibility = source.visible ? '👁️' : '🚫';
        const muteStatus = source.muted ? '🔇' : '🔊';
        const mediaIndicator = this.isMediaSource(source.type) ? '🎵' : '📺';
        sourceList += `${index + 1}. ${visibility} ${muteStatus} ${mediaIndicator} ${source.name} (${source.type})\n`;
      });

      await ctx.reply(sourceList, { parse_mode: 'Markdown' });
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'sources', undefined, sourceList, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to get sources: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'sources', undefined, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleScene(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sceneName = args?.slice(1).join(' ');
    
    if (!sceneName) {
      await ctx.reply('❌ Please specify a scene name. Usage: /scene <scene_name>');
      return;
    }

    try {
      await this.obsManager.setCurrentScene(sceneName);
      await ctx.reply(`✅ Switched to scene: ${sceneName}`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'scene', sceneName, `Switched to scene ${sceneName}`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to switch scene: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'scene', sceneName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleStream(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const action = args?.[1];
    
    if (!action || !['start', 'stop'].includes(action)) {
      await ctx.reply('❌ Please specify action. Usage: /stream <start|stop>');
      return;
    }

    try {
      if (action === 'start') {
        await this.obsManager.startStream();
        await ctx.reply('📡 Stream started successfully!');
      } else {
        await this.obsManager.stopStream();
        await ctx.reply('📡 Stream stopped successfully!');
      }
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'stream', action, `Stream ${action}ed`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to ${action} stream: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'stream', action, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleRecord(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const action = args?.[1];
    
    if (!action || !['start', 'stop'].includes(action)) {
      await ctx.reply('❌ Please specify action. Usage: /record <start|stop>');
      return;
    }

    try {
      if (action === 'start') {
        await this.obsManager.startRecord();
        await ctx.reply('🎥 Recording started successfully!');
      } else {
        await this.obsManager.stopRecord();
        await ctx.reply('🎥 Recording stopped successfully!');
      }
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'record', action, `Recording ${action}ed`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to ${action} recording: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'record', action, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleMute(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a source name. Usage: /mute <source_name>');
      return;
    }

    try {
      await this.obsManager.setSourceMute(sourceName, true);
      await ctx.reply(`🔇 ${sourceName} muted successfully!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'mute', sourceName, `${sourceName} muted`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to mute ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'mute', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleUnmute(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a source name. Usage: /unmute <source_name>');
      return;
    }

    try {
      await this.obsManager.setSourceMute(sourceName, false);
      await ctx.reply(`🔊 ${sourceName} unmuted successfully!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'unmute', sourceName, `${sourceName} unmuted`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to unmute ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'unmute', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleToggle(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a source name. Usage: /toggle <source_name>');
      return;
    }

    try {
      const isVisible = await this.obsManager.toggleSourceVisibility(sourceName);
      const status = isVisible ? 'visible' : 'hidden';
      await ctx.reply(`👁️ ${sourceName} is now ${status}!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'toggle', sourceName, `${sourceName} toggled to ${status}`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to toggle ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'toggle', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handlePlayMedia(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a media source name. Usage: /play <source_name>');
      return;
    }

    try {
      await this.obsManager.playMedia(sourceName);
      await ctx.reply(`▶️ ${sourceName} started playing!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'play', sourceName, `${sourceName} started playing`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to play ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'play', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handlePauseMedia(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a media source name. Usage: /pause <source_name>');
      return;
    }

    try {
      await this.obsManager.pauseMedia(sourceName);
      await ctx.reply(`⏸️ ${sourceName} paused!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'pause', sourceName, `${sourceName} paused`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to pause ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'pause', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleRestartMedia(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a media source name. Usage: /restart <source_name>');
      return;
    }

    try {
      await this.obsManager.restartMedia(sourceName);
      await ctx.reply(`🔄 ${sourceName} restarted!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'restart', sourceName, `${sourceName} restarted`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to restart ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'restart', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleStopMedia(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a media source name. Usage: /stopmedia <source_name>');
      return;
    }

    try {
      await this.obsManager.stopMedia(sourceName);
      await ctx.reply(`⏹️ ${sourceName} stopped!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'stopmedia', sourceName, `${sourceName} stopped`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to stop ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'stopmedia', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleNextMedia(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a media source name. Usage: /next <source_name>');
      return;
    }

    try {
      await this.obsManager.nextMedia(sourceName);
      await ctx.reply(`⏭️ Next media in ${sourceName} started!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'next', sourceName, `Next media in ${sourceName} started`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to play next media in ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'next', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handlePreviousMedia(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a media source name. Usage: /previous <source_name>');
      return;
    }

    try {
      await this.obsManager.previousMedia(sourceName);
      await ctx.reply(`⏮️ Previous media in ${sourceName} started!`);
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'previous', sourceName, `Previous media in ${sourceName} started`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to play previous media in ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'previous', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleMediaStatus(ctx: BotContext) {
    const startTime = Date.now();
    const args = ctx.message?.text?.split(' ');
    const sourceName = args?.slice(1).join(' ');
    
    if (!sourceName) {
      await ctx.reply('❌ Please specify a media source name. Usage: /mediastatus <source_name>');
      return;
    }

    try {
      const status = await this.obsManager.getMediaStatus(sourceName);
      
      let statusMessage = `📊 *Media Status for ${sourceName}:*\n\n`;
      statusMessage += `🎵 Playing: ${status.mediaState === 'playing' ? '✅ Yes' : '❌ No'}\n`;
      statusMessage += `⏸️ Paused: ${status.mediaState === 'paused' ? '✅ Yes' : '❌ No'}\n`;
      statusMessage += `⏹️ Stopped: ${status.mediaState === 'stopped' ? '✅ Yes' : '❌ No'}\n`;
      statusMessage += `⏱️ Duration: ${status.duration || 'Unknown'}\n`;
      statusMessage += `📍 Position: ${status.position || 'Unknown'}\n`;
      
      if (status.looping !== undefined) {
        statusMessage += `🔄 Looping: ${status.looping ? '✅ Yes' : '❌ No'}\n`;
      }
      
      await ctx.reply(statusMessage, { parse_mode: 'Markdown' });
      
      const executionTime = Date.now() - startTime;
      await this.logCommand(ctx, 'mediastatus', sourceName, `Media status for ${sourceName} retrieved`, 'success', executionTime);
    } catch (error) {
      const errorMessage = `❌ Failed to get media status for ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ctx.reply(errorMessage);
      await this.logCommand(ctx, 'mediastatus', sourceName, errorMessage, 'error', Date.now() - startTime);
    }
  }

  private async handleText(ctx: BotContext) {
    // Handle text messages that are not commands
    if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
      await ctx.reply('I understand commands. Use /help to see available commands.');
    }
  }

  private isMediaSource(sourceType: string): boolean {
    const mediaSourceTypes = [
      'ffmpeg_source',
      'vlc_source',
      'image_source',
      'browser_source',
      'text_gdiplus',
      'text_ft2_source',
      'monitor_capture',
      'window_capture',
      'game_capture',
      'dshow_input',
      'wasapi_input_capture',
      'wasapi_output_capture'
    ];
    
    return mediaSourceTypes.includes(sourceType.toLowerCase());
  }

  public async start() {
    try {
      await this.bot.launch();
      console.log('Telegram bot started successfully');
    } catch (error) {
      console.error('Failed to start Telegram bot:', error);
      throw error;
    }
  }

  public async stop() {
    try {
      await this.bot.stop();
      console.log('Telegram bot stopped');
    } catch (error) {
      console.error('Failed to stop Telegram bot:', error);
      throw error;
    }
  }

  public getBot() {
    return this.bot;
  }
}