import { NextRequest, NextResponse } from 'next/server';
import { BotManager } from '@/lib/bot/bot.manager';

export async function POST() {
  try {
    const botManager = BotManager.getInstance();
    await botManager.stop();

    return NextResponse.json({ message: 'Bot stopped successfully' });
  } catch (error) {
    console.error('Error stopping bot:', error);
    return NextResponse.json({ error: 'Failed to stop bot' }, { status: 500 });
  }
}