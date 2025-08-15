import { NextRequest, NextResponse } from 'next/server';
import { dbRaw } from '@/lib/db-raw';

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json({ 
        success: false,
        error: 'Chat ID and message are required' 
      }, { status: 400 });
    }

    // Get bot configuration
    const botConfig = await dbRaw.getBotConfig();
    
    if (!botConfig || !botConfig.bot_token) {
      return NextResponse.json({ 
        success: false,
        error: 'Bot not configured' 
      }, { status: 400 });
    }

    console.log('📤 Sending test message to chat:', chatId);
    console.log('📝 Message:', message);

    // Send message using Telegram API
    const response = await fetch(`https://api.telegram.org/bot${botConfig.bot_token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }

    console.log('✅ Message sent successfully:', result.result);

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully',
      messageId: result.result.message_id,
      chatId: result.result.chat.id,
      details: result.result
    });

  } catch (error) {
    console.error('Error sending test message:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to send test message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const botConfig = await dbRaw.getBotConfig();
    
    return NextResponse.json({
      message: 'Telegram Bot Test Message API',
      usage: 'POST /api/bot/send-test',
      parameters: {
        chatId: 'Telegram chat ID (required)',
        message: 'Message to send (required)'
      },
      example: {
        chatId: '123456789',
        message: 'Hello! This is a test message from OBS Control Bot 🎥'
      },
      botConfigured: !!botConfig?.bot_token,
      botUsername: botConfig?.bot_username || 'Not configured'
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Telegram Bot Test Message API',
      error: 'Failed to get bot configuration',
      usage: 'POST /api/bot/send-test',
      parameters: {
        chatId: 'Telegram chat ID (required)',
        message: 'Message to send (required)'
      }
    }, { status: 500 });
  }
}