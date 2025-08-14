import { NextRequest, NextResponse } from 'next/server';
import { OBSManager } from '@/lib/obs/obs.manager';

export async function DELETE(
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
    await obsManager.removeConnection(connectionId);

    return NextResponse.json({ message: 'OBS connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting OBS connection:', error);
    return NextResponse.json({ error: 'Failed to delete OBS connection' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connectionId = parseInt(id);
    const { name, host, port, password } = await request.json();
    
    if (isNaN(connectionId)) {
      return NextResponse.json({ error: 'Invalid connection ID' }, { status: 400 });
    }

    if (!name || !host || !port) {
      return NextResponse.json({ 
        error: 'Name, host, and port are required' 
      }, { status: 400 });
    }

    const portNumber = parseInt(port);
    if (isNaN(portNumber)) {
      return NextResponse.json({ 
        error: 'Port must be a valid number' 
      }, { status: 400 });
    }

    const obsManager = OBSManager.getInstance();
    await obsManager.updateConnection(connectionId, name, host, portNumber, password);

    return NextResponse.json({ message: 'OBS connection updated successfully' });
  } catch (error) {
    console.error('Error updating OBS connection:', error);
    return NextResponse.json({ error: 'Failed to update OBS connection' }, { status: 500 });
  }
}