import { NextRequest, NextResponse } from 'next/server';
import { BotManager } from '@/lib/bot/bot.manager';

export async function POST(request: NextRequest) {
  try {
    const { botToken } = await request.json();

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 });
    }

    const botManager = BotManager.getInstance();
    await botManager.updateBotToken(botToken);

    return NextResponse.json({ message: 'Bot configuration updated successfully' });
  } catch (error) {
    console.error('Error updating bot configuration:', error);
    return NextResponse.json({ error: 'Failed to update bot configuration' }, { status: 500 });
  }
}