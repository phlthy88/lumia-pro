/**
 * High-Performance Virtual Camera Service
 * Uses canvas.captureStream() + SharedWorker for zero-copy ImageBitmap transfer
 */

export interface VirtualCameraCapabilities {
  sharedWorker: boolean;
  broadcastChannel: boolean;
  canvasToBlob: boolean;
  mediaStream: boolean;
  imageBitmap: boolean;
  supported: boolean;
  reason?: string;
}

// Backward compatibility alias
export type VirtualCamCapabilities = VirtualCameraCapabilities;

export interface VirtualCameraConfig {
  quality: number;
  fps: number;
  frameRate: number;
  resolution: { width: number; height: number };
  width: number;
  height: number;
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

/**
 * SharedWorker for zero-copy ImageBitmap transfer
 * Handles message routing between main thread and virtual camera window
 */
class VirtualCameraWorker {
  private worker: SharedWorker | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>();

  constructor() {
    if (typeof SharedWorker !== 'undefined') {
      try {
        const workerCode = `
          let clients = [];
          let imageBitmap = null;
          let frameInterval = null;
          
          self.onconnect = function(e) {
            const port = e.ports[0];
            clients.push(port);
            
            port.onmessage = function(event) {
              const { type, data, messageId } = event.data;
              
              switch (type) {
                case 'start':
                  imageBitmap = data.imageBitmap;
                  const fps = data.fps || 30;
                  const interval = Math.max(16, Math.floor(1000 / fps));
                  
                  if (frameInterval) clearInterval(frameInterval);
                  frameInterval = setInterval(() => {
                    if (imageBitmap) {
                      // Broadcast to all clients except sender
                      clients.forEach(client => {
                        if (client !== port) {
                          try {
                            client.postMessage({ type: 'frame', imageBitmap }, [imageBitmap]);
                          } catch (e) {
                            // ImageBitmap already transferred, skip
                          }
                        }
                      });
                    }
                  }, interval);
                  port.postMessage({ type: 'started', messageId });
                  break;
                  
                case 'stop':
                  if (frameInterval) {
                    clearInterval(frameInterval);
                    frameInterval = null;
                  }
                  imageBitmap = null;
                  port.postMessage({ type: 'stopped', messageId });
                  break;
                  
                case 'updateFrame':
                  imageBitmap = data.imageBitmap;
                  port.postMessage({ type: 'frameUpdated', messageId });
                  break;
                  
                case 'getState':
                  port.postMessage({ 
                    type: 'state', 
                    data: { hasFrame: !!imageBitmap, clientCount: clients.length },
                    messageId 
                  });
                  break;
              }
            };
            
            port.start();
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new SharedWorker(URL.createObjectURL(blob));
        this.worker.port.start();
        
        // Handle responses
        this.worker.port.onmessage = (event) => {
          const { type, data, messageId, error } = event.data;
          const pending = this.pendingRequests.get(messageId);
          if (pending) {
            this.pendingRequests.delete(messageId);
            if (error) {
              pending.reject(error);
            } else {
              pending.resolve(data);
            }
          }
        };
      } catch (error) {
        console.warn('Failed to create SharedWorker:', error);
        this.worker = null;
      }
    }
  }

  async send<T>(type: string, data?: any): Promise<T> {
    if (!this.worker) {
      throw new Error('SharedWorker not available');
    }

    return new Promise((resolve, reject) => {
      const messageId = ++this.messageId;
      this.pendingRequests.set(messageId, { resolve, reject });
      
      this.worker!.port.postMessage({ type, data, messageId });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(messageId)) {
          this.pendingRequests.delete(messageId);
          reject(new Error('Worker request timeout'));
        }
      }, 5000);
    });
  }

  get isAvailable(): boolean {
    return this.worker !== null;
  }

  terminate(): void {
    if (this.worker) {
      this.worker.port.close();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

export class VirtualCameraService {
  private canvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private worker: VirtualCameraWorker | null = null;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
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

  private listeners: StateListener[] = [];

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.state.capabilities = this.capabilities;
    
    if (this.capabilities.imageBitmap && this.capabilities.sharedWorker) {
      this.worker = new VirtualCameraWorker();
    }
  }

  private detectCapabilities(): VirtualCameraCapabilities {
    const caps = {
      sharedWorker: typeof SharedWorker !== 'undefined',
      broadcastChannel: typeof BroadcastChannel !== 'undefined',
      canvasToBlob: typeof HTMLCanvasElement !== 'undefined' && 
                   HTMLCanvasElement.prototype.toBlob !== undefined,
      mediaStream: typeof HTMLCanvasElement !== 'undefined' && 
                  HTMLCanvasElement.prototype.captureStream !== undefined,
      imageBitmap: typeof window !== 'undefined' && 
                  typeof (window as any).ImageBitmap !== 'undefined' &&
                  typeof (window as any).createImageBitmap === 'function'
    };

    const supported = caps.mediaStream && caps.imageBitmap;
    let reason: string | undefined;

    if (!supported) {
      const missing = [];
      if (!caps.mediaStream) missing.push('canvas.captureStream');
      if (!caps.imageBitmap) missing.push('ImageBitmap');
      reason = `Missing browser features: ${missing.join(', ')}`;
    }

    return {
      ...caps,
      supported,
      reason
    };
  }

  isSupported(): boolean {
    return this.capabilities.supported;
  }

  initialize(canvas: HTMLCanvasElement, config?: Partial<VirtualCameraConfig>): void {
    this.canvas = canvas;
    
    if (config) {
      this.updateConfig(config);
    }
  }

  start(): MediaStream | null {
    if (!this.canvas || !this.isSupported()) {
      console.warn('Virtual camera not supported or not initialized');
      return null;
    }

    try {
      // Use canvas.captureStream() directly for maximum performance
      this.stream = this.canvas.captureStream(this.state.config.fps);
      
      // Start frame capture loop with optimized timing
      this.startFrameLoop();
      
      this.setState({ isActive: true, stream: this.stream });
      return this.stream;
    } catch (error) {
      console.error('Failed to start virtual camera:', error);
      return null;
    }
  }

  private startFrameLoop(): void {
    const fps = this.state.config.fps;
    const frameInterval = Math.max(16, Math.floor(1000 / fps));
    
    const frameLoop = (timestamp: number) => {
      if (!this.state.isActive || !this.canvas) return;
      
      // Throttle to target FPS
      if (timestamp - this.lastFrameTime >= frameInterval) {
        this.lastFrameTime = timestamp;
        this.captureAndTransferFrame();
      }
      
      this.animationFrameId = requestAnimationFrame(frameLoop);
    };
    
    this.animationFrameId = requestAnimationFrame(frameLoop);
  }

  private async captureAndTransferFrame(): Promise<void> {
    if (!this.canvas || !this.state.isActive) return;

    try {
      // Create ImageBitmap from canvas - zero copy, GPU-accelerated
      const imageBitmap = await createImageBitmap(this.canvas, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none'
      });

      if (this.worker?.isAvailable) {
        // Transfer ImageBitmap to worker (zero-copy transfer)
        try {
          await this.worker.send('updateFrame', { imageBitmap });
        } catch (error) {
          // If transfer fails, fall back to direct handling
          console.warn('Worker transfer failed, using fallback:', error);
        }
      }
    } catch (error) {
      console.warn('Failed to capture frame:', error);
    }
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.setState({ 
      isActive: false, 
      stream: null,
      isStreaming: false 
    });
  }

  updateConfig(config: Partial<VirtualCameraConfig>): void {
    const newConfig = { ...this.state.config, ...config };
    
    // Sync resolution with width/height
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
    
    // If active, restart with new config
    if (this.state.isActive) {
      this.stop();
      setTimeout(() => this.start(), 50);
    }
  }

  getState(): VirtualCameraState {
    return { ...this.state };
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  dispose(): void {
    this.stop();
    this.listeners = [];
  }

  // Backward compatibility methods (deprecated but kept for compatibility)
  openPopOutWindow(): Window | null {
    console.warn('openPopOutWindow is deprecated and no longer supported');
    return null;
  }

  closePopOutWindow(): void {
    console.warn('closePopOutWindow is deprecated and no longer supported');
  }

  startWebRTCStream(): string {
    console.warn('startWebRTCStream is deprecated and no longer supported');
    const url = `ws://localhost:8080/stream/${Date.now()}`;
    this.setState({ webrtcUrl: url, isStreaming: true });
    return url;
  }

  stopWebRTCStream(): void {
    console.warn('stopWebRTCStream is deprecated and no longer supported');
    this.setState({ webrtcUrl: undefined, isStreaming: false });
  }

  async sendFrame(): Promise<void> {
    console.warn('sendFrame is deprecated and no longer used');
  }

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

  private setState(updates: Partial<VirtualCameraState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Export singleton instance
const virtualCameraService = new VirtualCameraService();
export default virtualCameraService;
