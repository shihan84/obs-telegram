import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BotManager } from '@/lib/bot/bot.manager';
import { OBSManager } from '@/lib/obs/obs.manager';

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: null as string | null,
        tables: {} as Record<string, string>
      },
      bot: {
        configured: false,
        running: false,
        error: null as string | null,
        tokenPreview: '',
        apiConnection: false,
        botInfo: null as any
      },
      obs: {
        connections: [],
        managerInitialized: false,
        error: null as string | null
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        vercel: process.env.VERCEL ? 'Yes' : 'No',
        postgresUrl: process.env.POSTGRES_URL ? 'Configured' : 'Missing',
        databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Missing'
      }
    };

    // Test Database Connection
    try {
      await db.$queryRaw`SELECT 1`;
      diagnostics.database.connected = true;

      // Test all tables
      const tables = ['telegram_users', 'bot_configurations', 'obs_connections', 'scenes', 'sources', 'command_histories', 'stream_sessions'];
      for (const table of tables) {
        try {
          // Use a more robust approach to avoid prepared statement conflicts
          const result = await db.$queryRaw`SELECT COUNT(*)::text as count FROM ${table}`;
          diagnostics.database.tables[table] = 'OK';
        } catch (error) {
          // Try alternative approach if the first one fails
          try {
            const result = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
            diagnostics.database.tables[table] = 'OK';
          } catch (error2) {
            diagnostics.database.tables[table] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }
        }
      }
    } catch (error) {
      diagnostics.database.connected = false;
      diagnostics.database.error = error instanceof Error ? error.message : 'Database connection failed';
    }

    // Test Bot Configuration
    try {
      const botConfig = await db.botConfiguration.findFirst();
      if (botConfig && botConfig.bot_token) {
        diagnostics.bot.configured = true;
        diagnostics.bot.tokenPreview = botConfig.bot_token.substring(0, 10) + '...';

        // Test Bot API Connection
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`https://api.telegram.org/bot${botConfig.bot_token}/getMe`, {
            method: 'GET',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const responseText = await response.text();
            if (responseText.trim()) {
              const data = JSON.parse(responseText);
              if (data.ok) {
                diagnostics.bot.apiConnection = true;
                diagnostics.bot.botInfo = data.result;
              } else {
                diagnostics.bot.error = `API Error: ${data.description || 'Unknown error'}`;
              }
            } else {
              diagnostics.bot.error = 'Empty response from Telegram API';
            }
          } else {
            const errorText = await response.text();
            diagnostics.bot.error = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (apiError) {
          diagnostics.bot.error = apiError instanceof Error ? apiError.message : 'API test failed';
        }
      } else {
        diagnostics.bot.error = 'Bot token not configured';
      }
    } catch (error) {
      diagnostics.bot.error = error instanceof Error ? error.message : 'Bot configuration check failed';
    }

    // Test OBS Manager
    try {
      const obsManager = OBSManager.getInstance();
      diagnostics.obs.managerInitialized = true;

      // Get connections from database
      const connections = await db.oBSConnection.findMany({
        orderBy: { created_at: 'desc' }
      });

      diagnostics.obs.connections = connections.map(conn => ({
        id: conn.id,
        name: conn.name,
        host: conn.host,
        port: conn.port,
        isConnected: conn.is_connected,
        lastConnectedAt: conn.last_connected_at,
        createdAt: conn.created_at
      }));

    } catch (error) {
      diagnostics.obs.error = error instanceof Error ? error.message : 'OBS manager check failed';
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Error running diagnostics:', error);
    return NextResponse.json({ 
      error: 'Failed to run diagnostics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}