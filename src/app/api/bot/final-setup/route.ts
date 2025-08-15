import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botToken } = body;

    if (!botToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Bot token is required' 
      }, { status: 400 });
    }

    // Validate bot token with Telegram API
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid bot token',
        details: data.description 
      }, { status: 400 });
    }

    // Save configuration to database
    const config = await db.botConfiguration.upsert({
      where: { id: 1 },
      update: {
        bot_token: botToken,
        bot_username: data.result.username,
        welcome_message: 'Welcome to OBS Control Bot! 🎥\n\nUse /help to see available commands.',
        updated_at: new Date()
      },
      create: {
        bot_token: botToken,
        bot_username: data.result.username,
        welcome_message: 'Welcome to OBS Control Bot! 🎥\n\nUse /help to see available commands.',
        admin_only_commands: true,
        is_webhook_enabled: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Bot configured successfully',
      bot: {
        username: data.result.username,
        first_name: data.result.first_name,
        id: data.result.id
      }
    });

  } catch (error) {
    console.error('Bot setup error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to setup bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const config = await db.botConfiguration.findFirst();
    
    return NextResponse.json({
      configured: !!config,
      bot: config ? {
        username: config.bot_username,
        admin_only_commands: config.admin_only_commands,
        is_webhook_enabled: config.is_webhook_enabled
      } : null
    });
  } catch (error) {
    console.error('Bot status error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch bot status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
