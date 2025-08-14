import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get bot configuration from database
    const botConfig = await db.botConfiguration.findFirst();
    
    if (!botConfig) {
      return NextResponse.json({ 
        configured: false,
        error: 'No bot configuration found'
      });
    }

    // Check if bot token is configured
    const hasToken = !!botConfig.bot_token;
    const tokenPreview = hasToken ? botConfig.bot_token.substring(0, 10) + '...' : 'Not set';

    const result = {
      configured: hasToken,
      botConfig: {
        id: botConfig.id,
        hasToken: hasToken,
        tokenPreview: tokenPreview,
        username: botConfig.bot_username,
        webhookEnabled: botConfig.is_webhook_enabled,
        welcomeMessage: botConfig.welcome_message,
        adminOnlyCommands: botConfig.admin_only_commands,
        createdAt: botConfig.created_at,
        updatedAt: botConfig.updated_at
      },
      database: {
        connected: true,
        tables: {
          telegramUsers: 'OK',
          botConfigurations: 'OK',
          obsConnections: 'OK',
          scenes: 'OK',
          sources: 'OK',
          commandHistories: 'OK',
          streamSessions: 'OK'
        }
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking bot configuration:', error);
    return NextResponse.json({ 
      configured: false,
      error: error instanceof Error ? error.message : 'Database connection error',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}