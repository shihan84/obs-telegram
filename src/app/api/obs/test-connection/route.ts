import { NextRequest, NextResponse } from 'next/server';
import { OBSManager } from '@/lib/obs/obs.manager';

export async function POST(request: NextRequest) {
  try {
    const { host, port, password } = await request.json();

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

    // Test connection without saving to database
    const obsManager = OBSManager.getInstance();
    
    // Create a temporary test service
    const tempService = new (await import('@/lib/obs/obs.service')).OBSService(0);
    
    try {
      // Test connection
      await tempService.connectDirect(host, portNumber, password);
      
      // Get basic info
      const version = await tempService.getVersion();
      const scenes = await tempService.getSceneList();
      
      // Disconnect
      await tempService.disconnect();
      
      return NextResponse.json({
        success: true,
        message: 'OBS connection test successful',
        details: {
          version,
          sceneCount: scenes.scenes?.length || 0,
          scenes: scenes.scenes?.slice(0, 5) || [] // First 5 scenes
        }
      });
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        details: {
          host,
          port: portNumber,
          hasPassword: !!password
        }
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error testing OBS connection:', error);
    return NextResponse.json({ 
      error: 'Failed to test OBS connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}