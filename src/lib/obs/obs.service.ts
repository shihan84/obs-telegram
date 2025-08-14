import OBSWebSocket from 'obs-websocket-js';
import { db } from '@/lib/db';
import { OBSDiagnosticsService } from './obs.diagnostics';

export interface OBSScene {
  sceneIndex: number;
  sceneName: string;
}

export interface OBSSource {
  name: string;
  type: string;
  typeId: string;
  width: number;
  height: number;
  visible: boolean;
  muted: boolean;
}

export interface OBSStreamStatus {
  outputActive: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputBytes: number;
  outputCongestion: number;
  outputReconnect: boolean;
}

export interface OBSRecordStatus {
  outputActive: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputBytes: number;
}

export class OBSService {
  private obs: OBSWebSocket;
  private isConnected = false;
  private connectionId: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor(connectionId: number) {
    this.obs = new OBSWebSocket();
    this.connectionId = connectionId;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.obs.on('ConnectionOpened', () => {
      console.log('OBS WebSocket connection opened');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateConnectionStatus(true);
    });

    this.obs.on('ConnectionClosed', () => {
      console.log('OBS WebSocket connection closed');
      this.isConnected = false;
      this.updateConnectionStatus(false);
      this.handleReconnect();
    });

    this.obs.on('AuthenticationSuccess', () => {
      console.log('OBS authentication successful');
    });

    this.obs.on('AuthenticationFailure', (reason) => {
      console.error('OBS authentication failed:', reason);
      this.isConnected = false;
    });

    this.obs.on('error', (err) => {
      console.error('OBS WebSocket error:', err);
    });

    // Scene events
    this.obs.on('SceneNameChanged', (data) => {
      console.log('Scene changed:', data);
    });

    this.obs.on('SceneCreated', (data) => {
      console.log('Scene created:', data);
    });

    this.obs.on('SceneRemoved', (data) => {
      console.log('Scene removed:', data);
    });

    // Source events
    this.obs.on('SourceCreated', (data) => {
      console.log('Source created:', data);
    });

    this.obs.on('SourceDestroyed', (data) => {
      console.log('Source destroyed:', data);
    });

    this.obs.on('SourceMuteStateChanged', (data) => {
      console.log('Source mute state changed:', data);
    });

    // Stream events
    this.obs.on('StreamStateChanged', (data) => {
      console.log('Stream state changed:', data);
    });

    // Record events
    this.obs.on('RecordStateChanged', (data) => {
      console.log('Record state changed:', data);
    });
  }

  private async updateConnectionStatus(connected: boolean) {
    try {
      await db.oBSConnection.update({
        where: { id: this.connectionId },
        data: {
          isConnected: connected,
          lastConnectedAt: connected ? new Date() : null
        }
      });
    } catch (error) {
      console.error('Failed to update connection status:', error);
    }
  }

  private async handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to OBS (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(async () => {
        try {
          await this.connect();
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public async connect(): Promise<void> {
    try {
      const connection = await db.oBSConnection.findUnique({
        where: { id: this.connectionId }
      });

      if (!connection) {
        throw new Error('OBS connection not found');
      }

      // Run diagnostics before attempting connection
      console.log(`Running diagnostics for ${connection.host}:${connection.port}`);
      const diagnostics = await OBSDiagnosticsService.testConnection(connection.host, connection.port);
      
      if (!diagnostics.isReachable || !diagnostics.isPortOpen) {
        console.warn('Connection diagnostics failed:', diagnostics);
        throw new Error(`Cannot connect to OBS: ${diagnostics.error || 'Connection failed'}. Recommendations: ${diagnostics.recommendations.join(', ')}`);
      }

      console.log(`Diagnostics passed, connecting to OBS at ${connection.host}:${connection.port}`);

      const connectOptions: any = {
        address: `${connection.host}:${connection.port}`,
        secure: false
      };

      if (connection.password) {
        connectOptions.password = connection.password;
      }

      await this.obs.connect(connectOptions);
      console.log(`Successfully connected to OBS at ${connection.host}:${connection.port}`);
    } catch (error) {
      console.error('Failed to connect to OBS:', error);
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('OBS connection refused. Please ensure OBS Studio is running and WebSocket server is enabled.');
        } else if (error.message.includes('ETIMEDOUT')) {
          throw new Error('OBS connection timeout. Check network connectivity and firewall settings.');
        } else if (error.message.includes('Authentication')) {
          throw new Error('OBS authentication failed. Please check the WebSocket password.');
        } else {
          throw new Error(`OBS connection failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.obs.disconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect from OBS:', error);
      throw error;
    }
  }

  public isObsConnected(): boolean {
    return this.isConnected;
  }

  // Scene Management
  public async getSceneList(): Promise<OBSScene[]> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetSceneList');
      return response.scenes.map((scene: any) => ({
        sceneIndex: scene.sceneIndex,
        sceneName: scene.sceneName
      }));
    } catch (error) {
      console.error('Failed to get scene list:', error);
      throw error;
    }
  }

  public async getCurrentScene(): Promise<string> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetCurrentProgramScene');
      return response.currentProgramSceneName;
    } catch (error) {
      console.error('Failed to get current scene:', error);
      throw error;
    }
  }

  public async setCurrentScene(sceneName: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('SetCurrentProgramScene', {
        sceneName: sceneName
      });
    } catch (error) {
      console.error('Failed to set current scene:', error);
      throw error;
    }
  }

  // Source Management
  public async getSourceList(sceneName?: string): Promise<OBSSource[]> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetSceneItemList', {
        sceneName: sceneName || await this.getCurrentScene()
      });

      return response.sceneItems.map((item: any) => ({
        name: item.sourceName,
        type: item.inputKind || 'unknown',
        typeId: item.sourceType,
        width: item.sourceWidth || 0,
        height: item.sourceHeight || 0,
        visible: item.sceneItemEnabled,
        muted: false // Will be updated separately
      }));
    } catch (error) {
      console.error('Failed to get source list:', error);
      throw error;
    }
  }

  public async setSourceVisibility(sourceName: string, visible: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const sceneName = await this.getCurrentScene();
      const response = await this.obs.call('GetSceneItemId', {
        sceneName: sceneName,
        sourceName: sourceName
      });

      await this.obs.call('SetSceneItemEnabled', {
        sceneName: sceneName,
        sceneItemId: response.sceneItemId,
        sceneItemEnabled: visible
      });
    } catch (error) {
      console.error('Failed to set source visibility:', error);
      throw error;
    }
  }

  public async toggleSourceVisibility(sourceName: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const sceneName = await this.getCurrentScene();
      const response = await this.obs.call('GetSceneItemId', {
        sceneName: sceneName,
        sourceName: sourceName
      });

      const itemResponse = await this.obs.call('GetSceneItemEnabled', {
        sceneName: sceneName,
        sceneItemId: response.sceneItemId
      });

      const newVisibility = !itemResponse.sceneItemEnabled;
      
      await this.obs.call('SetSceneItemEnabled', {
        sceneName: sceneName,
        sceneItemId: response.sceneItemId,
        sceneItemEnabled: newVisibility
      });

      return newVisibility;
    } catch (error) {
      console.error('Failed to toggle source visibility:', error);
      throw error;
    }
  }

  // Audio Management
  public async getSourcesMuteStatus(): Promise<{ [key: string]: boolean }> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetInputList');
      const muteStatus: { [key: string]: boolean } = {};

      for (const input of response.inputs) {
        try {
          const muteResponse = await this.obs.call('GetInputMute', {
            inputName: input.inputName
          });
          muteStatus[input.inputName] = muteResponse.inputMuted;
        } catch (error) {
          console.warn(`Failed to get mute status for ${input.inputName}:`, error);
        }
      }

      return muteStatus;
    } catch (error) {
      console.error('Failed to get sources mute status:', error);
      throw error;
    }
  }

  public async setSourceMute(sourceName: string, muted: boolean): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('SetInputMute', {
        inputName: sourceName,
        inputMuted: muted
      });
    } catch (error) {
      console.error('Failed to set source mute:', error);
      throw error;
    }
  }

  public async toggleSourceMute(sourceName: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('ToggleInputMute', {
        inputName: sourceName
      });
      return response.inputMuted;
    } catch (error) {
      console.error('Failed to toggle source mute:', error);
      throw error;
    }
  }

  // Stream Management
  public async getStreamStatus(): Promise<OBSStreamStatus> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetStreamStatus');
      return {
        outputActive: response.outputActive,
        outputTimecode: response.outputTimecode,
        outputDuration: response.outputDuration,
        outputBytes: response.outputBytes,
        outputCongestion: response.outputCongestion,
        outputReconnect: response.outputReconnect
      };
    } catch (error) {
      console.error('Failed to get stream status:', error);
      throw error;
    }
  }

  public async startStream(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('StartStream');
    } catch (error) {
      console.error('Failed to start stream:', error);
      throw error;
    }
  }

  public async stopStream(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('StopStream');
    } catch (error) {
      console.error('Failed to stop stream:', error);
      throw error;
    }
  }

  // Record Management
  public async getRecordStatus(): Promise<OBSRecordStatus> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetRecordStatus');
      return {
        outputActive: response.outputActive,
        outputTimecode: response.outputTimecode,
        outputDuration: response.outputDuration,
        outputBytes: response.outputBytes
      };
    } catch (error) {
      console.error('Failed to get record status:', error);
      throw error;
    }
  }

  public async startRecord(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('StartRecord');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  public async stopRecord(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('StopRecord');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  // Utility Methods
  public async getStats(): Promise<any> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetStats');
      return response;
    } catch (error) {
      console.error('Failed to get OBS stats:', error);
      throw error;
    }
  }

  public async getVersion(): Promise<string> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetVersion');
      return `${response.obsVersion.major}.${response.obsVersion.minor}.${response.obsVersion.patch}`;
    } catch (error) {
      console.error('Failed to get OBS version:', error);
      throw error;
    }
  }
}