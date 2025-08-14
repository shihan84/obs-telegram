import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const stats = await logger.getLogStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    await logger.error('API', 'Failed to retrieve log stats', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30');

    const deletedCount = await logger.clearLogs(olderThanDays);
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} log entries older than ${olderThanDays} days`,
      deletedCount
    });
  } catch (error) {
    await logger.error('API', 'Failed to clear logs', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}