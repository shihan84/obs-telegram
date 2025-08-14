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

    console.log('🤖 Configuring bot with token:', botToken.substring(0, 10) + '...');

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

      // Now save to database using raw SQL to avoid Prisma issues
      try {
        // Check if bot configuration already exists
        const checkResult = await db.$queryRaw`
          SELECT id FROM bot_configurations LIMIT 1
        ` as any[];

        if (checkResult.length > 0) {
          // Update existing configuration
          await db.$queryRaw`
            UPDATE bot_configurations 
            SET bot_token = ${botToken}, 
                bot_username = ${data.result.username || null},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${checkResult[0].id}
          `;
          console.log('✅ Bot configuration updated');
        } else {
          // Insert new configuration
          await db.$queryRaw`
            INSERT INTO bot_configurations (bot_token, bot_username, created_at, updated_at)
            VALUES (${botToken}, ${data.result.username || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `;
          console.log('✅ Bot configuration created');
        }

        return NextResponse.json({
          success: true,
          message: 'Bot configured successfully',
          botInfo: {
            id: data.result.id,
            username: data.result.username,
            first_name: data.result.first_name,
            is_bot: data.result.is_bot
          }
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({
          success: false,
          error: 'Failed to save bot configuration to database',
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
    console.error('Error configuring bot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to configure bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple Bot Configuration API',
    usage: 'POST /api/bot/configure-simple',
    parameters: {
      botToken: 'Telegram bot token (required)'
    },
    example: {
      botToken: '7821790748:AAHyjGAZqt6MQqwt_KM8QIrQ66aV5_buroI'
    },
    note: 'This endpoint tests the bot token and saves it to the database'
  });
}