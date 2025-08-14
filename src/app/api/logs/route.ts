import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      level: searchParams.get('level') as any,
      component: searchParams.get('component') as any,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      userId: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined
    };

    const logs = await logger.getLogs(options);
    
    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: logs.length
      }
    });
  } catch (error) {
    await logger.error('API', 'Failed to retrieve logs', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, component, message, details, userId } = body;

    if (!component || !message) {
      return NextResponse.json({
        success: false,
        error: 'Component and message are required'
      }, { status: 400 });
    }

    await logger.log({
      level: level || 'INFO',
      component,
      message,
      details,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Log entry created successfully'
    });
  } catch (error) {
    await logger.error('API', 'Failed to create log entry', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}