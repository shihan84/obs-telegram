import { NextRequest, NextResponse } from 'next/server';
import { BotManager } from '@/lib/bot/bot.manager';

export async function GET() {
  try {
    const botManager = BotManager.getInstance();
    const isRunning = botManager.isBotRunning();

    // Simple status without database queries to avoid prepared statement issues
    const status = {
      isRunning,
      userCount: 0,
      activeUsers: 0,
      botConfigured: false, // Will be updated when database works
      obsConnections: [],
      databaseStatus: 'unknown',
      message: 'Bot status (simplified - database queries disabled due to prepared statement issue)'
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