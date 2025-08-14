import { OBSService } from './obs.service';
import { db } from '@/lib/db';

// Global instance to persist across Next.js API routes
declare global {
  var globalOBSManager: OBSManager | undefined;
}

export class OBSManager {
  private static instance: OBSManager;
  private connections: Map<number, OBSService> = new Map();
  private defaultConnectionId: number | null = null;

  private constructor() {}

  public static getInstance(): OBSManager {
    // Use global instance for Next.js API routes
    if (typeof global !== 'undefined' && global.globalOBSManager) {
      return global.globalOBSManager;
    }
    
    if (!OBSManager.instance) {
      OBSManager.instance = new OBSManager();
      
      // Store in global for Next.js API routes
      if (typeof global !== 'undefined') {
        global.globalOBSManager = OBSManager.instance;
      }
    }
    
    // Auto-initialize connections if they haven't been initialized yet
    if (OBSManager.instance.connections.size === 0) {
      OBSManager.instance.initializeConnections().catch(error => {
        console.error('Failed to auto-initialize OBS connections:', error);
      });
    }
    
    return OBSManager.instance;
  }

  public async addConnection(name: string, host: string, port: number, password?: string): Promise<number> {
    try {
      const connection = await db.oBSConnection.create({
        data: {
          name,
          host,
          port,
          password
        }
      });

      const obsService = new OBSService(connection.id);
      this.connections.set(connection.id, obsService);

      // Set as default if it's the first connection
      if (this.connections.size === 1) {
        this.defaultConnectionId = connection.id;
      }

      return connection.id;
    } catch (error) {
      console.error('Failed to add OBS connection:', error);
      throw error;
    }
  }

  public async removeConnection(connectionId: number): Promise<void> {
    try {
      const obsService = this.connections.get(connectionId);
      if (obsService) {
        await obsService.disconnect();
        this.connections.delete(connectionId);
      }

      await db.oBSConnection.delete({
        where: { id: connectionId }
      });

      // Update default connection if needed
      if (this.defaultConnectionId === connectionId) {
        this.defaultConnectionId = this.connections.size > 0 ? this.connections.keys().next().value : null;
      }
    } catch (error) {
      console.error('Failed to remove OBS connection:', error);
      throw error;
    }
  }

  public async updateConnection(connectionId: number, name: string, host: string, port: number, password?: string): Promise<void> {
    try {
      // Check if connection exists
      const existingConnection = await db.oBSConnection.findUnique({
        where: { id: connectionId }
      });

      if (!existingConnection) {
        throw new Error('OBS connection not found');
      }

      // Disconnect if currently connected
      const obsService = this.connections.get(connectionId);
      if (obsService) {
        await obsService.disconnect();
        this.connections.delete(connectionId);
      }

      // Update the connection in database
      await db.oBSConnection.update({
        where: { id: connectionId },
        data: {
          name,
          host,
          port,
          password: password || null,
          is_connected: false,
          last_connected_at: null
        }
      });

      // Create new OBS service with updated connection
      const newObsService = new OBSService(connectionId);
      this.connections.set(connectionId, newObsService);

      console.log(`OBS connection ${connectionId} updated successfully`);
    } catch (error) {
      console.error('Failed to update OBS connection:', error);
      throw error;
    }
  }

  public async connect(connectionId?: number): Promise<void> {
    const targetConnectionId = connectionId || this.defaultConnectionId;
    
    if (!targetConnectionId) {
      throw new Error('No OBS connection available');
    }

    const obsService = this.connections.get(targetConnectionId);
    if (!obsService) {
      throw new Error(`OBS connection not found (ID: ${targetConnectionId})`);
    }

    await obsService.connect();
  }

  public async disconnect(connectionId?: number): Promise<void> {
    const targetConnectionId = connectionId || this.defaultConnectionId;
    if (!targetConnectionId) {
      return;
    }

    const obsService = this.connections.get(targetConnectionId);
    if (obsService) {
      await obsService.disconnect();
    }
  }

  public async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.values()).map(service => service.disconnect());
    await Promise.all(disconnectPromises);
  }

  public getConnection(connectionId?: number): OBSService | null {
    const targetConnectionId = connectionId || this.defaultConnectionId;
    if (!targetConnectionId) {
      return null;
    }
    return this.connections.get(targetConnectionId) || null;
  }

  public getDefaultConnection(): OBSService | null {
    return this.defaultConnectionId ? this.connections.get(this.defaultConnectionId) || null : null;
  }

  public setDefaultConnection(connectionId: number): void {
    if (this.connections.has(connectionId)) {
      this.defaultConnectionId = connectionId;
    }
  }

  public getAllConnections(): Array<{ id: number; name: string; connected: boolean }> {
    return Array.from(this.connections.entries()).map(([id, service]) => ({
      id,
      name: `Connection ${id}`,
      connected: service.isObsConnected()
    }));
  }

  public async initializeConnections(): Promise<void> {
    try {
      const connections = await db.oBSConnection.findMany();
      
      for (const connection of connections) {
        const obsService = new OBSService(connection.id);
        this.connections.set(connection.id, obsService);

        // Set as default if it's the first connection or if it was previously connected
        if (this.connections.size === 1 || connection.is_connected) {
          this.defaultConnectionId = connection.id;
        }

        // Auto-connect if it was previously connected
        if (connection.is_connected) {
          try {
            await obsService.connect();
          } catch (error) {
            console.error(`Failed to auto-connect to OBS connection ${connection.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize OBS connections:', error);
      throw error;
    }
  }

  // Convenience methods that use the default connection
  public async getSceneList(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getSceneList();
  }

  public async getCurrentScene(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getCurrentScene();
  }

  public async setCurrentScene(sceneName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.setCurrentScene(sceneName);
  }

  public async getSourceList(sceneName?: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getSourceList(sceneName);
  }

  public async setSourceVisibility(sourceName: string, visible: boolean, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.setSourceVisibility(sourceName, visible);
  }

  public async toggleSourceVisibility(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.toggleSourceVisibility(sourceName);
  }

  public async getSourcesMuteStatus(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getSourcesMuteStatus();
  }

  public async setSourceMute(sourceName: string, muted: boolean, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.setSourceMute(sourceName, muted);
  }

  public async toggleSourceMute(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.toggleSourceMute(sourceName);
  }

  public async getStreamStatus(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getStreamStatus();
  }

  public async startStream(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.startStream();
  }

  public async stopStream(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.stopStream();
  }

  public async getRecordStatus(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getRecordStatus();
  }

  public async startRecord(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.startRecord();
  }

  public async stopRecord(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.stopRecord();
  }

  public async getStats(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getStats();
  }

  public async getVersion(connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getVersion();
  }

  // Media Source Control Methods
  public async playMedia(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.playMedia(sourceName);
  }

  public async pauseMedia(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.pauseMedia(sourceName);
  }

  public async restartMedia(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.restartMedia(sourceName);
  }

  public async stopMedia(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.stopMedia(sourceName);
  }

  public async nextMedia(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.nextMedia(sourceName);
  }

  public async previousMedia(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.previousMedia(sourceName);
  }

  public async getMediaStatus(sourceName: string, connectionId?: number) {
    const obsService = this.getConnection(connectionId);
    if (!obsService) {
      throw new Error('No OBS connection available');
    }
    return obsService.getMediaStatus(sourceName);
  }
}