import { NextRequest, NextResponse } from 'next/server';
import { OBSManager } from '@/lib/obs/obs.manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connectionId = parseInt(id);
    
    if (isNaN(connectionId)) {
      return NextResponse.json({ error: 'Invalid connection ID' }, { status: 400 });
    }

    const obsManager = OBSManager.getInstance();
    await obsManager.disconnect(connectionId);

    return NextResponse.json({ message: 'OBS connection disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting OBS:', error);
    return NextResponse.json({ error: 'Failed to disconnect OBS' }, { status: 500 });
  }
}