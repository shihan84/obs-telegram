import { NextRequest, NextResponse } from 'next/server';
import { OBSManager } from '@/lib/obs/obs.manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId') ? parseInt(searchParams.get('connectionId')!) : undefined;

    const obsManager = OBSManager.getInstance();
    
    try {
      const status = await obsManager.getRecordStatus(connectionId);
      return NextResponse.json(status);
    } catch (error) {
      if (error instanceof Error && error.message.includes('OBS not connected')) {
        return NextResponse.json({ error: 'OBS is not connected. Please connect to OBS first.' }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting record status:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get record status' 
    }, { status: 500 });
  }
}