import { NextRequest, NextResponse } from 'next/server';
import { OBSManager } from '@/lib/obs/obs.manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = parseInt(params.id);
    
    if (isNaN(connectionId)) {
      return NextResponse.json({ error: 'Invalid connection ID' }, { status: 400 });
    }

    const obsManager = OBSManager.getInstance();
    await obsManager.connect(connectionId);

    return NextResponse.json({ message: 'OBS connection connected successfully' });
  } catch (error) {
    console.error('Error connecting OBS:', error);
    return NextResponse.json({ error: 'Failed to connect OBS' }, { status: 500 });
  }
}