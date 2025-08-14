import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BotManager } from '@/lib/bot/bot.manager';

export async function GET() {
  try {
    const botManager = BotManager.getInstance();
    const botConfig = await db.botConfiguration.findFirst();
    const userCount = await db.telegramUser.count();
    const activeUsers = await db.telegramUser.count({ where: { isActive: true } });
    const obsConnections = await db.oBSConnection.findMany();

    const status = {
      isRunning: botManager.isBotRunning(),
      userCount,
      activeUsers,
      botConfigured: !!botConfig?.bot_token,
      obsConnections: obsConnections.map(conn => ({
        id: conn.id,
        name: conn.name,
        connected: conn.is_connected
      }))
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching bot status:', error);
    return NextResponse.json({ error: 'Failed to fetch bot status' }, { status: 500 });
  }
}