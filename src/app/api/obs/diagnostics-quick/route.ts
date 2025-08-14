import { NextRequest, NextResponse } from 'next/server';
import { createConnection } from 'net';

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

    // Quick diagnostic results
    const diagnostics = {
      host,
      port: portNumber,
      isReachable: false,
      isPortOpen: false,
      connectionTime: 0,
      recommendations: [],
      error: undefined as string | undefined,
      quickTest: true
    };

    const startTime = Date.now();

    try {
      // Quick TCP connection test
      const socketTest = await testTCPPortQuick(host, portNumber);
      diagnostics.isPortOpen = socketTest.isOpen;
      diagnostics.isReachable = socketTest.isReachable;
      diagnostics.error = socketTest.error;
      
      // Generate quick recommendations
      diagnostics.recommendations = generateQuickRecommendations(diagnostics);
      
    } catch (error) {
      diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
      diagnostics.recommendations = [
        '❌ Connection test failed',
        '• Check if OBS Studio is running',
        '• Verify WebSocket server is enabled in OBS',
        '• Check network connectivity',
        '• Verify host and port are correct'
      ];
    }

    diagnostics.connectionTime = Date.now() - startTime;

    return NextResponse.json({
      diagnostics,
      timestamp: new Date().toISOString(),
      quickTest: true
    });

  } catch (error) {
    console.error('Error running quick OBS diagnostics:', error);
    return NextResponse.json({ 
      error: 'Failed to run diagnostics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testTCPPortQuick(host: string, port: number): Promise<{
  isOpen: boolean;
  isReachable: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    const socket = createConnection(port, host);
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({
          isOpen: false,
          isReachable: false,
          error: 'Connection timeout'
        });
      }
    }, 5000); // 5 second timeout

    socket.on('connect', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        socket.destroy();
        resolve({ 
          isOpen: true, 
          isReachable: true 
        });
      }
    });

    socket.on('error', (error: any) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        let isReachable = false;
        let errorMsg = 'Connection failed';
        
        if (error.code === 'ECONNREFUSED') {
          isReachable = true; // Host is reachable but port is closed
          errorMsg = 'Connection refused - port is closed';
        } else if (error.code === 'ETIMEDOUT') {
          errorMsg = 'Connection timeout - host may be unreachable';
        } else if (error.code === 'EHOSTUNREACH') {
          errorMsg = 'Host unreachable';
        }
        
        resolve({ 
          isOpen: false, 
          isReachable,
          error: errorMsg 
        });
      }
    });
  });
}

function generateQuickRecommendations(diagnostics: any): string[] {
  const recommendations: string[] = [];

  if (!diagnostics.isReachable) {
    recommendations.push(
      '❌ Host is not reachable',
      '• Check if the IP address is correct',
      '• Verify network connectivity',
      '• Check if the target machine is online'
    );
  } else if (!diagnostics.isPortOpen) {
    recommendations.push(
      '❌ Port is not accessible',
      '• Verify OBS Studio is running',
      '• Enable WebSocket server in OBS: Tools → WebSocket Server Settings',
      '• Check if port is correctly configured',
      '• Ensure firewall allows the connection'
    );
  } else {
    recommendations.push(
      '✅ Port is accessible!',
      '• OBS WebSocket server should be reachable',
      '• Check your authentication settings',
      '• Verify the connection password'
    );
  }

  return recommendations;
}