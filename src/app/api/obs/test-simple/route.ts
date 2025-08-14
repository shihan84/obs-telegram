import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { host, port, password } = await request.json();

    if (!host || !port) {
      return NextResponse.json({ 
        success: false,
        error: 'Host and port are required' 
      }, { status: 400 });
    }

    const portNumber = parseInt(port);
    if (isNaN(portNumber)) {
      return NextResponse.json({ 
        success: false,
        error: 'Port must be a valid number' 
      }, { status: 400 });
    }

    console.log(`🔍 Testing simple OBS connection to ${host}:${portNumber}`);
    
    // Simple TCP test using Node.js net module
    const net = await import('net');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(NextResponse.json({
            success: false,
            error: 'Connection timeout',
            details: {
              host,
              port: portNumber,
              hasPassword: !!password,
              suggestion: 'Check if OBS WebSocket server is running and port is accessible'
            }
          }, { status: 400 }));
        }
      }, 10000);

      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.destroy();
          
          resolve(NextResponse.json({
            success: true,
            message: 'TCP connection successful',
            details: {
              host,
              port: portNumber,
              hasPassword: !!password,
              suggestion: 'OBS WebSocket server appears to be running. Try adding the connection in the application.'
            }
          }));
        }
      });

      socket.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          
          let errorMessage = 'Connection failed';
          let suggestion = 'Check OBS WebSocket server configuration';
          
          if (error.message.includes('ECONNREFUSED')) {
            errorMessage = 'Connection refused';
            suggestion = 'OBS WebSocket server is not running or port is blocked';
          } else if (error.message.includes('ETIMEDOUT')) {
            errorMessage = 'Connection timeout';
            suggestion = 'Network connectivity issues or firewall blocking the connection';
          } else if (error.message.includes('ENOTFOUND')) {
            errorMessage = 'Host not found';
            suggestion = 'Check the host address and DNS configuration';
          }
          
          resolve(NextResponse.json({
            success: false,
            error: errorMessage,
            details: {
              host,
              port: portNumber,
              hasPassword: !!password,
              originalError: error.message,
              suggestion
            }
          }, { status: 400 }));
        }
      });

      socket.connect(portNumber, host);
    });

  } catch (error) {
    console.error('Error in simple OBS connection test:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test OBS connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple OBS Connection Test API',
    usage: 'POST /api/obs/test-simple',
    parameters: {
      host: 'OBS server IP or hostname (required)',
      port: 'OBS WebSocket port (required, usually 4455)',
      password: 'OBS WebSocket password (optional)'
    },
    example: {
      host: '103.167.123.195',
      port: 4455,
      password: 'your-password'
    },
    note: 'This test only checks TCP connectivity, not full WebSocket functionality'
  });
}