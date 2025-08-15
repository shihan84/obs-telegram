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

    console.log('🤖 Setting up bot with token:', botToken.substring(0, 10) + '...');

    // Test bot API connection
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      console.log('✅ Bot API connection successful:', data.result.username);

      // Save configuration using Prisma
      try {
        // Clear existing configurations
        await db.botConfiguration.deleteMany();
        
        // Insert new configuration
        await db.botConfiguration.create({
          data: {
            bot_token: botToken,
            bot_username: data.result.username,
            welcome_message: 'Welcome to OBS Control Bot! 🎥',
            admin_only_commands: true,
            is_webhook_enabled: false
          }
        });
        
        console.log('✅ Bot configuration saved successfully');

        return NextResponse.json({
          success: true,
          message: 'Bot configured successfully',
          botInfo: {
            id: data.result.id,
            username: data.result.username,
            first_name: data.result.first_name
          }
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({
          success: false,
          error: 'Failed to save bot configuration',
          details: dbError instanceof Error ? dbError.message : 'Database error'
        }, { status: 500 });
      }

    } catch (apiError) {
      console.error('Bot API test failed:', apiError);
      return NextResponse.json({
        success: false,
        error: 'Bot token validation failed',
        details: apiError instanceof Error ? apiError.message : 'API test failed'
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
  try {
    const config = await db.botConfiguration.findFirst();
    
    return NextResponse.json({
      configured: !!config,
      config: config ? {
        id: config.id,
        bot_username: config.bot_username,
        admin_only_commands: config.admin_only_commands,
        is_webhook_enabled: config.is_webhook_enabled,
        created_at: config.created_at
      } : null
    });
  } catch (error) {
    console.error('Error fetching bot status:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch bot status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
