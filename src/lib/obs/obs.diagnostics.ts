import { createConnection } from 'net';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface OBSDiagnostics {
  host: string;
  port: number;
  isReachable: boolean;
  isPortOpen: boolean;
  connectionTime: number;
  error?: string;
  recommendations: string[];
  pingTime?: number;
  portCheckMethod?: string;
  obsWebSocketReady?: boolean;
  firewallStatus?: string;
  networkInterface?: string;
}

export class OBSDiagnosticsService {
  static async testConnection(host: string, port: number): Promise<OBSDiagnostics> {
    const startTime = Date.now();
    const diagnostics: OBSDiagnostics = {
      host,
      port,
      isReachable: false,
      isPortOpen: false,
      connectionTime: 0,
      recommendations: []
    };

    try {
      // Test basic reachability with ping
      const pingResult = await this.testPing(host);
      diagnostics.isReachable = pingResult.success;
      diagnostics.pingTime = pingResult.time;

      // Test port connectivity with multiple methods
      const portResult = await this.testPortWithMultipleMethods(host, port);
      diagnostics.isPortOpen = portResult.isOpen;
      diagnostics.portCheckMethod = portResult.method;
      diagnostics.firewallStatus = portResult.firewallStatus;

      // Additional OBS-specific checks
      if (diagnostics.isPortOpen) {
        diagnostics.obsWebSocketReady = await this.testOBSWebSocketProtocol(host, port);
      }

    } catch (error) {
      diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
    }

    diagnostics.recommendations = this.generateRecommendations(diagnostics);
    diagnostics.connectionTime = Date.now() - startTime;
    return diagnostics;
  }

  private static async testPing(host: string): Promise<{ success: boolean; time: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      exec(`ping -c 1 -W 3 ${host}`, (error) => {
        const time = Date.now() - startTime;
        resolve({
          success: !error,
          time
        });
      });
    });
  }

  private static async testPortWithMultipleMethods(host: string, port: number): Promise<{
    isOpen: boolean;
    method: string;
    firewallStatus: string;
  }> {
    // Method 1: TCP Connection Test
    const tcpResult = await this.testTCPPort(host, port);
    if (tcpResult.isOpen) {
      return {
        isOpen: true,
        method: 'TCP Connection',
        firewallStatus: 'Port appears open'
      };
    }

    // Method 2: Netcat test if available
    const netcatResult = await this.testWithNetcat(host, port);
    if (netcatResult.available) {
      return {
        isOpen: netcatResult.isOpen,
        method: 'Netcat',
        firewallStatus: netcatResult.isOpen ? 'Port appears open' : 'Port appears closed or filtered'
      };
    }

    // Method 3: Telnet test if available
    const telnetResult = await this.testWithTelnet(host, port);
    if (telnetResult.available) {
      return {
        isOpen: telnetResult.isOpen,
        method: 'Telnet',
        firewallStatus: telnetResult.isOpen ? 'Port appears open' : 'Port appears closed or filtered'
      };
    }

    return {
      isOpen: false,
      method: 'TCP Connection',
      firewallStatus: tcpResult.firewallStatus || 'Port appears closed or filtered'
    };
  }

  private static async testTCPPort(host: string, port: number): Promise<{
    isOpen: boolean;
    firewallStatus?: string;
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
            firewallStatus: 'Connection timed out - possible firewall filtering'
          });
        }
      }, 5000);

      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.destroy();
          resolve({ isOpen: true });
        }
      });

      socket.on('error', (error: any) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          let firewallStatus = 'Port appears closed';
          
          if (error.code === 'ETIMEDOUT') {
            firewallStatus = 'Connection timed out - possible firewall filtering';
          } else if (error.code === 'ECONNREFUSED') {
            firewallStatus = 'Connection refused - port is closed or no service listening';
          } else if (error.code === 'EHOSTUNREACH') {
            firewallStatus = 'Host unreachable - network routing issue';
          }
          
          resolve({ isOpen: false, firewallStatus });
        }
      });
    });
  }

  private static async testWithNetcat(host: string, port: number): Promise<{
    available: boolean;
    isOpen: boolean;
  }> {
    try {
      const { stdout, stderr } = await execAsync(`nc -z -w3 ${host} ${port} 2>&1`);
      return {
        available: true,
        isOpen: stderr === '' || !stderr.includes('refused')
      };
    } catch (error) {
      return { available: false, isOpen: false };
    }
  }

  private static async testWithTelnet(host: string, port: number): Promise<{
    available: boolean;
    isOpen: boolean;
  }> {
    try {
      const { stdout } = await execAsync(`echo "" | timeout 3 telnet ${host} ${port} 2>&1 | grep -E "Connected|Escape"`);
      return {
        available: true,
        isOpen: stdout.length > 0
      };
    } catch (error) {
      return { available: false, isOpen: false };
    }
  }

  private static async testOBSWebSocketProtocol(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = createConnection(port, host);
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      }, 3000);

      socket.on('connect', () => {
        // Send a simple WebSocket handshake attempt
        socket.write('GET / HTTP/1.1\r\nHost: ' + host + '\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n');
        
        socket.once('data', (data) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            const response = data.toString();
            const isWebSocket = response.includes('101 Switching Protocols') || 
                              response.includes('WebSocket') || 
                              response.includes('OBS-WebSocket');
            socket.destroy();
            resolve(isWebSocket);
          }
        });
      });

      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(false);
        }
      });
    });
  }

  private static generateRecommendations(diagnostics: OBSDiagnostics): string[] {
    const recommendations: string[] = [];

    if (!diagnostics.isReachable) {
      recommendations.push(
        '❌ Host is not reachable',
        '• Check if the IP address 103.167.123.195 is correct',
        '• Verify network connectivity between bot and OBS machine',
        '• Check if OBS machine is powered on and connected to network',
        '• Disable firewall temporarily for testing',
        '• Check if VPN or proxy is blocking the connection',
        '• Try pinging the host from your machine: ping 103.167.123.195'
      );
    } else if (!diagnostics.isPortOpen) {
      recommendations.push(
        '❌ Port 4466 is not accessible',
        '• Verify OBS Studio is running on the target machine',
        '• Enable WebSocket server in OBS: Tools → WebSocket Server Settings',
        '• Check if port 4466 is configured in OBS WebSocket settings',
        '• Ensure firewall allows incoming connections on port 4466',
        '• Check if another application is using port 4466',
        '• Try using the default OBS WebSocket port (4455) instead',
        '• Restart OBS Studio after changing WebSocket settings'
      );

      // Add specific recommendations based on firewall status
      if (diagnostics.firewallStatus?.includes('timeout') || diagnostics.firewallStatus?.includes('filtering')) {
        recommendations.push(
          '🔥 Firewall appears to be blocking the connection',
          '• Windows: Allow port 4466 in Windows Defender Firewall',
          '• Linux: Check ufw status: sudo ufw status',
          '• Linux: Allow port: sudo ufw allow 4466',
          '• Router: Forward port 4466 to the OBS machine',
          '• Cloud provider: Check security group rules'
        );
      }

      if (diagnostics.firewallStatus?.includes('refused')) {
        recommendations.push(
          '🚫 Port is actively refusing connections',
          '• OBS WebSocket server is likely not running',
          '• Check OBS WebSocket server settings: Tools → WebSocket Server Settings',
          '• Ensure "Enable WebSocket server" is checked',
          '• Verify the server is listening on the correct port (4466)',
          '• Check OBS logs for WebSocket server errors'
        );
      }
    } else if (!diagnostics.obsWebSocketReady) {
      recommendations.push(
        '⚠️ Port is open but not responding as OBS WebSocket',
        '• Verify that the service on port 4466 is actually OBS WebSocket',
        '• Check if another application is using port 4466',
        '• Restart OBS Studio to ensure WebSocket server restarts',
        '• Check OBS WebSocket server authentication settings'
      );
    } else {
      recommendations.push(
        '✅ Connection test passed!',
        '• OBS WebSocket server is accessible',
        '• Check your bot configuration for correct password',
        '• Verify bot has permission to connect to OBS'
      );
    }

    // Add general recommendations
    recommendations.push(
      '',
      '🔧 General Troubleshooting:',
      '• Set a WebSocket password in OBS for security',
      '• Use localhost/127.0.0.1 if bot and OBS are on the same machine',
      '• Check OBS logs for WebSocket server errors: Help → Logs → Show Log Files',
      '• Test connection locally using OBS WebSocket test tools',
      '• Consider using OBS WebSocket browser extension for testing'
    );

    // Add specific port recommendations
    if (diagnostics.port !== 4455) {
      recommendations.push(
        '',
        '💡 Port Recommendation:',
        '• Consider using the default OBS WebSocket port (4455) for better compatibility',
        '• Default port is less likely to be blocked by firewalls'
      );
    }

    return recommendations;
  }

  static async getSystemInfo(): Promise<{
    platform: string;
    nodeVersion: string;
    networkInterfaces: Array<{ name: string; address: string; netmask?: string; mac?: string }>;
    firewallStatus?: string;
    portScanResults?: Array<{ port: number; status: string; service?: string }>;
  }> {
    const networkInterfaces: Array<{ name: string; address: string; netmask?: string; mac?: string }> = [];
    
    try {
      const { stdout } = await execAsync('ip addr show 2>/dev/null || ifconfig 2>/dev/null');
      const lines = stdout.split('\n');
      
      let currentInterface = '';
      let currentMac = '';
      for (const line of lines) {
        const interfaceMatch = line.match(/^\d+:\s+([^:]+):/);
        if (interfaceMatch) {
          currentInterface = interfaceMatch[1];
          currentMac = '';
        }
        
        const macMatch = line.match(/link\/ether\s+([0-9a-fA-F:]+)/);
        if (macMatch) {
          currentMac = macMatch[1];
        }
        
        const ipMatch = line.match(/inet\s+(\d+\.\d+\.\d+\.\d+)(?:\/(\d+))?/);
        if (ipMatch && currentInterface && !currentInterface.includes('lo')) {
          networkInterfaces.push({
            name: currentInterface,
            address: ipMatch[1],
            netmask: ipMatch[2] ? this.cidrToNetmask(parseInt(ipMatch[2])) : undefined,
            mac: currentMac || undefined
          });
        }
      }
    } catch (error) {
      console.warn('Could not get network interfaces:', error);
    }

    // Check firewall status
    let firewallStatus = 'Unknown';
    try {
      const { stdout } = await execAsync('sudo ufw status 2>/dev/null || echo "not_available"');
      if (stdout.includes('active')) {
        firewallStatus = 'UFW is active';
      } else if (stdout.includes('inactive')) {
        firewallStatus = 'UFW is inactive';
      }
    } catch (error) {
      try {
        const { stdout } = await execAsync('systemctl status firewalld 2>/dev/null || echo "not_available"');
        if (stdout.includes('active (running)')) {
          firewallStatus = 'Firewalld is active';
        }
      } catch (error2) {
        firewallStatus = 'Could not determine firewall status';
      }
    }

    // Scan common OBS WebSocket ports
    const portScanResults: Array<{ port: number; status: string; service?: string }> = [];
    const obsPorts = [4455, 4466, 4444]; // Common OBS WebSocket ports
    
    for (const port of obsPorts) {
      try {
        const result = await this.testTCPPort('127.0.0.1', port);
        portScanResults.push({
          port,
          status: result.isOpen ? 'Open' : 'Closed',
          service: result.isOpen ? 'OBS WebSocket?' : undefined
        });
      } catch (error) {
        portScanResults.push({
          port,
          status: 'Error'
        });
      }
    }

    return {
      platform: process.platform,
      nodeVersion: process.version,
      networkInterfaces,
      firewallStatus,
      portScanResults
    };
  }

  private static cidrToNetmask(cidr: number): string {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [
      (mask >>> 24) & 0xff,
      (mask >>> 16) & 0xff,
      (mask >>> 8) & 0xff,
      mask & 0xff
    ].join('.');
  }
}