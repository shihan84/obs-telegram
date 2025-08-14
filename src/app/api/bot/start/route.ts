import { NextRequest, NextResponse } from 'next/server';
import { BotManager } from '@/lib/bot/bot.manager';

export async function POST() {
  try {
    const botManager = BotManager.getInstance();
    await botManager.initialize();

    return NextResponse.json({ message: 'Bot started successfully' });
  } catch (error) {
    console.error('Error starting bot:', error);
    return NextResponse.json({ error: 'Failed to start bot' }, { status: 500 });
  }
}