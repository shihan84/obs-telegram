import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json({ error: 'Chat ID and message are required' }, { status: 400 });
    }

    // Get bot configuration from database
    const botConfig = await db.botConfiguration.findFirst();
    
    if (!botConfig || !botConfig.bot_token) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 });
    }

    try {
      // Send test message
      const response = await fetch(
        `https://api.telegram.org/bot${botConfig.bot_token}/sendMessage?chat_id=${encodeURIComponent(chatId)}&text=${encodeURIComponent(message)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          return NextResponse.json({ 
            success: true, 
            messageId: data.result.message_id,
            chatId: data.result.chat.id
          });
        } else {
          return NextResponse.json({ error: data.description || 'Failed to send message' }, { status: 400 });
        }
      } else {
        const errorText = await response.text();
        return NextResponse.json({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }, { status: 500 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Network error' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test message:', error);
    return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 });
  }
}