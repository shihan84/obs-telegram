import { NextRequest, NextResponse } from 'next/server';
import { OBSManager } from '@/lib/obs/obs.manager';

export async function POST(request: NextRequest) {
  try {
    const { action, connectionId } = await request.json();

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "start" or "stop"' }, { status: 400 });
    }

    const obsManager = OBSManager.getInstance();
    
    try {
      if (action === 'start') {
        await obsManager.startRecord(connectionId);
        return NextResponse.json({ message: 'Recording started successfully', action: 'started' });
      } else {
        await obsManager.stopRecord(connectionId);
        return NextResponse.json({ message: 'Recording stopped successfully', action: 'stopped' });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('OBS not connected')) {
        return NextResponse.json({ error: 'OBS is not connected. Please connect to OBS first.' }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error controlling recording:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to control recording' 
    }, { status: 500 });
  }
}