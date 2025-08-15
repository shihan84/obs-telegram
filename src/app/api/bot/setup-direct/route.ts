import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { botToken } = await request.json();

    if (!botToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Bot token is required' 
      }, { status: 400 });
    }

    console.log('🤖 Setting up bot directly with token:', botToken.substring(0, 10) + '...');

    // Test bot API connection first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from Telegram API');
      }

      const data = JSON.parse(responseText);
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
      }

      console.log('✅ Bot API connection successful:', data.result.username);

      // Use direct SQL to avoid Prisma prepared statement issues
      try {
        // Clear any existing configurations and insert new one
        await db.$executeRaw`TRUNCATE TABLE bot_configurations RESTART IDENTITY CASCADE`;
        
        await db.$executeRaw`
          INSERT INTO bot_configurations (bot_token, bot_username, welcome_message, admin_only_commands, is_webhook_enabled, created_at, updated_at)
          VALUES (
            ${botToken}, 
            ${data.result.username || null}, 
            'Welcome to OBS Control Bot! Use /help to see available commands.', 
            true, 
            false, 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
          )
        `;
        
        console.log('✅ Bot configuration saved successfully');

        return NextResponse.json({
          success: true,
          message: 'Bot configured successfully',
          botInfo: {
            id: data.result.id,
            username: data.result.username,
            first_name: data.result.first_name,
            is_bot: data.result.is_bot
          },
          nextSteps: {
            message: 'Bot is now configured! You can test the connection and add OBS connections.',
            diagnostics: 'Visit /api/diagnostics to verify the setup'
          }
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({
          success: false,
          error: 'Failed to save bot configuration to database',
          details: dbError instanceof Error ? dbError.message : 'Database error',
          suggestion: 'There may be a database schema issue. Try running the database sync first.'
        }, { status: 500 });
      }

    } catch (apiError) {
      console.error('Bot API test failed:', apiError);
      return NextResponse.json({
        success: false,
        error: 'Bot token validation failed',
        details: apiError instanceof Error ? apiError.message : 'API test failed',
        suggestion: 'Please check your bot token and ensure it\'s valid.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error setting up bot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to setup bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Direct Bot Setup API',
    usage: 'POST /api/bot/setup-direct',
    parameters: {
      botToken: 'Telegram bot token (required)'
    },
    example: {
      botToken: '7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI'
    },
    note: 'This endpoint directly sets up the bot configuration, avoiding Prisma issues'
  });
}