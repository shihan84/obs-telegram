import OBSWebSocket from 'obs-websocket-js';
import { db } from '@/lib/db';
import { OBSDiagnosticsService } from './obs.diagnostics';
import { createConnection } from 'net';

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

  private async testPortQuick(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = createConnection(port, host);
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      }, 5000);

      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.destroy();
          resolve(true);
        }
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

        // Run quick diagnostics before attempting connection
      console.log(`Running quick diagnostics for ${connection.host}:${connection.port}`);
      
      // Simple TCP connection test
      const isPortOpen = await this.testPortQuick(connection.host, connection.port);
      
      if (!isPortOpen) {
        throw new Error(`Cannot connect to OBS: Port ${connection.port} is not accessible. Please ensure OBS Studio is running and WebSocket server is enabled.`);
      }

      console.log(`Diagnostics passed, connecting to OBS at ${connection.host}:${connection.port}`);

      const address = `ws://${connection.host}:${connection.port}`;
      const connectOptions: any = {
        secure: false
      };

      if (connection.password) {
        connectOptions.password = connection.password;
      }

      await this.obs.connect(address, connectOptions);
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

  public async connectDirect(host: string, port: number, password?: string): Promise<void> {
    try {
      console.log(`Connecting directly to OBS at ${host}:${port}`);
      
      // Test port accessibility first
      const isPortOpen = await this.testPortQuick(host, port);
      
      if (!isPortOpen) {
        throw new Error(`Cannot connect to OBS: Port ${port} is not accessible. Please ensure OBS Studio is running and WebSocket server is enabled.`);
      }

      console.log(`Port test passed, connecting to OBS at ${host}:${port}`);

      const address = `ws://${host}:${port}`;
      const connectOptions: any = {
        secure: false
      };

      if (password) {
        connectOptions.password = password;
      }

      await this.obs.connect(address, connectOptions);
      console.log(`Successfully connected to OBS at ${host}:${port}`);
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

  public async getVersion(): Promise<any> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetVersion');
      return response;
    } catch (error) {
      console.error('Failed to get OBS version:', error);
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
      // Check if stream is already active
      const status = await this.getStreamStatus();
      if (status.outputActive) {
        console.log('Stream is already active');
        return;
      }

      await this.obs.call('StartStream');
      console.log('Stream started successfully');
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
      // Check if stream is active
      const status = await this.getStreamStatus();
      if (!status.outputActive) {
        console.log('Stream is not active');
        return;
      }

      await this.obs.call('StopStream');
      console.log('Stream stopped successfully');
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

  // Media Source Control Methods
  public async playMedia(sourceName: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('PlayPauseMedia', {
        sourceName,
        playPause: true
      });
      console.log(`Media ${sourceName} started successfully`);
    } catch (error) {
      console.error('Failed to play media:', error);
      throw error;
    }
  }

  public async pauseMedia(sourceName: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('PlayPauseMedia', {
        sourceName,
        playPause: false
      });
      console.log(`Media ${sourceName} paused successfully`);
    } catch (error) {
      console.error('Failed to pause media:', error);
      throw error;
    }
  }

  public async restartMedia(sourceName: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('RestartMedia', {
        sourceName
      });
      console.log(`Media ${sourceName} restarted successfully`);
    } catch (error) {
      console.error('Failed to restart media:', error);
      throw error;
    }
  }

  public async stopMedia(sourceName: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('StopMedia', {
        sourceName
      });
      console.log(`Media ${sourceName} stopped successfully`);
    } catch (error) {
      console.error('Failed to stop media:', error);
      throw error;
    }
  }

  public async nextMedia(sourceName: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('NextMedia', {
        sourceName
      });
      console.log(`Next media in ${sourceName} played successfully`);
    } catch (error) {
      console.error('Failed to play next media:', error);
      throw error;
    }
  }

  public async previousMedia(sourceName: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('PreviousMedia', {
        sourceName
      });
      console.log(`Previous media in ${sourceName} played successfully`);
    } catch (error) {
      console.error('Failed to play previous media:', error);
      throw error;
    }
  }

  public async getMediaStatus(sourceName: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetMediaInputStatus', {
        inputName: sourceName
      });
      return response;
    } catch (error) {
      console.error('Failed to get media status:', error);
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