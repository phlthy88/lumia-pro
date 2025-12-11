/**
 * Virtual Camera service with capability detection
 * Gracefully handles environments where features are not available
 */

export interface VirtualCameraCapabilities {
  broadcastChannel: boolean;
  windowOpen: boolean;
  canvasToBlob: boolean;
  mediaStream: boolean;
  supported: boolean;
  reason?: string;
}

// Backward compatibility alias
export type VirtualCamCapabilities = VirtualCameraCapabilities;

export interface VirtualCameraConfig {
  quality: number;
  fps: number;
  frameRate: number; // Alias for fps for backward compatibility
  resolution: { width: number; height: number };
  width: number; // Direct width access for backward compatibility
  height: number; // Direct height access for backward compatibility
  enableAudio: boolean;
}

export interface VirtualCameraState {
  isActive: boolean;
  isWindowOpen: boolean;
  stream: MediaStream | null;
  config: VirtualCameraConfig;
  webrtcUrl?: string;
  isStreaming: boolean;
  capabilities: VirtualCameraCapabilities;
}

type StateListener = (state: VirtualCameraState) => void;

export class VirtualCameraService {
  private canvas: HTMLCanvasElement | null = null;
  private channel: BroadcastChannel | null = null;
  private popoutWindow: Window | null = null;
  private stream: MediaStream | null = null;
  private listeners: StateListener[] = [];
  private capabilities: VirtualCameraCapabilities;
  
  private state: VirtualCameraState = {
    isActive: false,
    isWindowOpen: false,
    stream: null,
    config: {
      quality: 0.8,
      fps: 30,
      frameRate: 30,
      resolution: { width: 1280, height: 720 },
      width: 1280,
      height: 720,
      enableAudio: false
    },
    isStreaming: false,
    capabilities: this.detectCapabilities()
  };

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.state.capabilities = this.capabilities;
  }

  /**
   * Detect what virtual camera features are available
   */
  private detectCapabilities(): VirtualCameraCapabilities {
    const caps = {
      broadcastChannel: typeof BroadcastChannel !== 'undefined',
      windowOpen: typeof window !== 'undefined' && typeof window.open === 'function',
      canvasToBlob: typeof HTMLCanvasElement !== 'undefined' && 
                   HTMLCanvasElement.prototype.toBlob !== undefined,
      mediaStream: typeof HTMLCanvasElement !== 'undefined' && 
                  HTMLCanvasElement.prototype.captureStream !== undefined
    };

    const supported = caps.broadcastChannel && caps.windowOpen && caps.canvasToBlob;
    let reason: string | undefined;

    if (!supported) {
      const missing = [];
      if (!caps.broadcastChannel) missing.push('BroadcastChannel');
      if (!caps.windowOpen) missing.push('window.open');
      if (!caps.canvasToBlob) missing.push('canvas.toBlob');
      reason = `Missing browser features: ${missing.join(', ')}`;
    }

    return {
      ...caps,
      supported,
      reason
    };
  }

  /**
   * Check if virtual camera is supported in current environment
   */
  isSupported(): boolean {
    return this.capabilities.supported;
  }

  /**
   * Initialize virtual camera with canvas
   */
  initialize(canvas: HTMLCanvasElement, config?: Partial<VirtualCameraConfig>): void {
    this.canvas = canvas;
    
    if (config) {
      this.updateConfig(config);
    }

    // Only create BroadcastChannel if supported
    if (this.capabilities.broadcastChannel) {
      try {
        this.channel = new BroadcastChannel('lumia-virtual-camera');
      } catch (error) {
        console.warn('Failed to create BroadcastChannel:', error);
      }
    }
  }

  /**
   * Start virtual camera
   */
  start(): MediaStream | null {
    if (!this.canvas || !this.isSupported()) {
      console.warn('Virtual camera not supported or not initialized');
      return null;
    }

    try {
      // Create MediaStream from canvas if supported
      if (this.capabilities.mediaStream) {
        this.stream = this.canvas.captureStream(this.state.config.fps);
      }

      this.setState({ isActive: true, stream: this.stream });
      return this.stream;
    } catch (error) {
      console.warn('Failed to start virtual camera:', error);
      return null;
    }
  }

  /**
   * Stop virtual camera
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.setState({ 
      isActive: false, 
      stream: null,
      isStreaming: false 
    });
  }

  /**
   * Open pop-out window
   */
  openPopOutWindow(): Window | null {
    if (!this.capabilities.windowOpen) {
      console.warn('window.open not supported');
      return null;
    }

    try {
      this.popoutWindow = window.open(
        '/virtual-camera.html',
        'lumia-virtual-camera',
        'width=1280,height=720,resizable=yes'
      );

      if (this.popoutWindow) {
        this.setState({ isWindowOpen: true });
      }

      return this.popoutWindow;
    } catch (error) {
      console.warn('Failed to open pop-out window:', error);
      return null;
    }
  }

  /**
   * Close pop-out window
   */
  closePopOutWindow(): void {
    if (this.popoutWindow) {
      this.popoutWindow.close();
      this.popoutWindow = null;
      this.setState({ isWindowOpen: false });
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VirtualCameraConfig>): void {
    const newConfig = { ...this.state.config, ...config };
    
    // Sync resolution with width/height for backward compatibility
    if (config.width !== undefined || config.height !== undefined) {
      newConfig.resolution = {
        width: config.width ?? newConfig.width,
        height: config.height ?? newConfig.height
      };
    }
    if (config.resolution) {
      newConfig.width = config.resolution.width;
      newConfig.height = config.resolution.height;
    }
    if (config.frameRate !== undefined) {
      newConfig.fps = config.frameRate;
    }
    if (config.fps !== undefined) {
      newConfig.frameRate = config.fps;
    }
    
    this.setState({ config: newConfig });
  }

  /**
   * Start WebRTC stream (placeholder)
   */
  startWebRTCStream(): string {
    const url = `ws://localhost:8080/stream/${Date.now()}`;
    this.setState({ webrtcUrl: url, isStreaming: true });
    return url;
  }

  /**
   * Stop WebRTC stream
   */
  stopWebRTCStream(): void {
    this.setState({ webrtcUrl: undefined, isStreaming: false });
  }

  /**
   * Send frame to virtual camera
   */
  async sendFrame(): Promise<void> {
    if (!this.state.isActive || !this.channel || !this.canvas) {
      return;
    }

    try {
      const dataUrl = this.canvas.toDataURL('image/jpeg', this.state.config.quality);
      
      this.channel.postMessage({
        type: 'frame',
        dataUrl,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to send frame to virtual camera:', error);
    }
  }

  /**
   * Get setup instructions for different apps
   */
  static getSetupInstructions(app: 'zoom' | 'meet' | 'teams' | 'obs' | 'discord'): string {
    const instructions = {
      zoom: 'In Zoom, go to Settings > Video > Camera and select "Lumia Virtual Camera"',
      meet: 'In Google Meet, click the camera icon and select "Lumia Virtual Camera"',
      teams: 'In Microsoft Teams, go to Settings > Devices > Camera and select "Lumia Virtual Camera"',
      obs: 'In OBS, add a "Video Capture Device" source and select "Lumia Virtual Camera"',
      discord: 'In Discord, go to Settings > Voice & Video > Camera and select "Lumia Virtual Camera"'
    };
    
    return instructions[app] || 'Select "Lumia Virtual Camera" in your application\'s camera settings';
  }

  /**
   * Get current state
   */
  getState(): VirtualCameraState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stop();
    this.closePopOutWindow();
    
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    
    this.listeners = [];
  }

  private setState(updates: Partial<VirtualCameraState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Export singleton instance
const virtualCameraService = new VirtualCameraService();
export default virtualCameraService;
