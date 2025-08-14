import { NextRequest, NextResponse } from 'next/server';
import { OBSDiagnosticsService } from '@/lib/obs/obs.diagnostics';

export async function POST(request: NextRequest) {
  try {
    const { host, port } = await request.json();

    if (!host || !port) {
      return NextResponse.json({ 
        error: 'Host and port are required' 
      }, { status: 400 });
    }

    const portNumber = parseInt(port);
    if (isNaN(portNumber)) {
      return NextResponse.json({ 
        error: 'Port must be a valid number' 
      }, { status: 400 });
    }

    // Run connection diagnostics
    const diagnostics = await OBSDiagnosticsService.testConnection(host, portNumber);

    // Get system information
    const systemInfo = await OBSDiagnosticsService.getSystemInfo();

    return NextResponse.json({
      diagnostics,
      systemInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error running OBS diagnostics:', error);
    return NextResponse.json({ 
      error: 'Failed to run diagnostics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}