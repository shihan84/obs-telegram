import { NextRequest, NextResponse } from 'next/server';
import { BotManager } from '@/lib/bot/bot.manager';
import { dbRaw } from '@/lib/db-raw';

export async function GET() {
  try {
    const botManager = BotManager.getInstance();
    const isRunning = botManager.isBotRunning();

    // Use raw database queries to avoid prepared statement issues
    const botConfig = await dbRaw.getBotConfig();
    const userCount = await dbRaw.getUserCount();
    const activeUsers = await dbRaw.getActiveUserCount();
    const obsConnections = await dbRaw.getOBSConnections();

    const status = {
      isRunning,
      userCount,
      activeUsers,
      botConfigured: !!botConfig?.bot_token,
      obsConnections: obsConnections.map(conn => ({
        id: conn.id,
        name: conn.name,
        connected: conn.is_connected
      })),
      databaseStatus: 'connected',
      message: 'Bot status (using raw database queries)'
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching bot status:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch bot status',
      details: error.message,
      isRunning: false,
      databaseStatus: 'error'
    }, { status: 500 });
  }
}