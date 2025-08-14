import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OBSManager } from '@/lib/obs/obs.manager';

export async function GET() {
  try {
    const connections = await db.oBSConnection.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Error fetching OBS connections:', error);
    return NextResponse.json({ error: 'Failed to fetch OBS connections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, host, port, password } = await request.json();

    if (!name || !host || !port) {
      return NextResponse.json({ error: 'Name, host, and port are required' }, { status: 400 });
    }

    const obsManager = OBSManager.getInstance();
    const connectionId = await obsManager.addConnection(name, host, port, password);

    return NextResponse.json({ 
      message: 'OBS connection added successfully',
      connectionId 
    });
  } catch (error) {
    console.error('Error adding OBS connection:', error);
    return NextResponse.json({ error: 'Failed to add OBS connection' }, { status: 500 });
  }
}