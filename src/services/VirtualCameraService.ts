// ============================================================================
// VIRTUAL CAMERA SERVICE - Persistent Cross-App Camera Output
// ============================================================================
// Enables Lumina Studio Pro effects to work in Zoom, Meet, Teams, etc.
// Uses a dedicated pop-out window that can be screen-shared as a "camera"

export interface VirtualCamCapabilities {
  supported: boolean;
  captureStream: boolean;
  displayMedia: boolean;
  popoutWindow: boolean;
  reason?: string;
}

export function detectCapabilities(): VirtualCamCapabilities {
  const canvas = document.createElement('canvas');
  const captureStream = 'captureStream' in canvas;
  const displayMedia = typeof navigator.mediaDevices?.getDisplayMedia === 'function';
  const popoutWindow = typeof window.open === 'function';
  const supported = captureStream;

  return {
    supported,
    captureStream,
    displayMedia,
    popoutWindow,
    reason: !supported ? 'Canvas captureStream not supported in this browser' : undefined
  };
}

export interface VirtualCameraConfig {
  width: number;
  height: number;
  frameRate: number;
  maintainAspectRatio: boolean;
  showOverlay: boolean;
  overlayPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface VirtualCameraState {
  isActive: boolean;
  isWindowOpen: boolean;
  stream: MediaStream | null;
  windowRef: Window | null;
  config: VirtualCameraConfig;
  webrtcUrl?: string;
  isStreaming: boolean;
}

const DEFAULT_CONFIG: VirtualCameraConfig = {
  width: 1920,
  height: 1080,
  frameRate: 30,
  maintainAspectRatio: true,
  showOverlay: false,
  overlayPosition: 'bottom-right'
};

export class VirtualCameraService {
  private state: VirtualCameraState = {
    isActive: false,
    isWindowOpen: false,
    stream: null,
    windowRef: null,
    config: { ...DEFAULT_CONFIG },
    isStreaming: false
  };

  private sourceCanvas: HTMLCanvasElement | null = null;
  private virtualCanvas: HTMLCanvasElement | null = null;
  private virtualCtx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private popoutAnimationId: number | null = null;
  private listeners: Set<(state: VirtualCameraState) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private lastBroadcastTime = 0;

  /**
   * Initialize the virtual camera with a source canvas
   */
  initialize(sourceCanvas: HTMLCanvasElement, config?: Partial<VirtualCameraConfig>) {
    this.sourceCanvas = sourceCanvas;
    if (config) {
      this.state.config = { ...this.state.config, ...config };
    }
    
    // Create internal canvas for the virtual camera output
    this.virtualCanvas = document.createElement('canvas');
    this.virtualCanvas.width = this.state.config.width;
    this.virtualCanvas.height = this.state.config.height;
    this.virtualCtx = this.virtualCanvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });

    console.log('[VirtualCamera] Initialized with config:', this.state.config);
  }

  /**
   * Start the virtual camera - creates a MediaStream from the processed canvas
   */
  start(): MediaStream | null {
    if (!this.sourceCanvas || !this.virtualCanvas || !this.virtualCtx) {
      console.error('[VirtualCamera] Not initialized. Call initialize() first.');
      return null;
    }

    if (this.state.isActive) {
      return this.state.stream;
    }

    // Create the stream from the virtual canvas
    this.state.stream = this.virtualCanvas.captureStream(this.state.config.frameRate);
    this.state.isActive = true;

    // Start the render loop
    this.startRenderLoop();
    this.notifyListeners();

    console.log('[VirtualCamera] Started - Stream ready for use');
    return this.state.stream;
  }

  /**
   * Stop the virtual camera
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.popoutAnimationId) {
      cancelAnimationFrame(this.popoutAnimationId);
      this.popoutAnimationId = null;
    }

    if (this.state.stream) {
      this.state.stream.getTracks().forEach(track => track.stop());
      this.state.stream = null;
    }

    this.state.isActive = false;
    this.notifyListeners();
    console.log('[VirtualCamera] Stopped');
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.stop();
    this.closePopOutWindow();
    this.stopWebRTCStream();
    this.listeners.clear();
    this.sourceCanvas = null;
    this.virtualCanvas = null;
    this.virtualCtx = null;
    this.state = {
      isActive: false,
      isWindowOpen: false,
      stream: null,
      windowRef: null,
      config: { ...DEFAULT_CONFIG },
      isStreaming: false
    };
    console.log('[VirtualCamera] Disposed');
  }

  /**
   * Open a dedicated pop-out window for screen sharing in video calls
   */
  openPopOutWindow(): Window | null {
    if (this.state.windowRef && !this.state.windowRef.closed) {
      this.state.windowRef.focus();
      return this.state.windowRef;
    }

    // Wait for source canvas to be ready
    if (!this.sourceCanvas || this.sourceCanvas.width === 0 || this.sourceCanvas.height === 0) {
      console.warn('[VirtualCamera] Source canvas not ready. Initialize first.');
      return null;
    }

    const { width, height } = this.state.config;
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    const left = (screenWidth - width) / 2;
    const top = (screenHeight - height) / 2;

    const popout = window.open(
      '',
      'LuminaVirtualCamera',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );

    if (!popout) {
      console.error('[VirtualCamera] Failed to open pop-out window. Check popup blocker.');
      return null;
    }

    // Set up the pop-out window
    popout.document.title = 'Lumina Studio - Virtual Camera';
    popout.document.body.style.cssText = `
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    `;

    // Create canvas in pop-out
    const canvas = popout.document.createElement('canvas');
    canvas.id = 'virtual-camera-output';
    canvas.width = width;
    canvas.height = height;
    canvas.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    `;
    popout.document.body.appendChild(canvas);

    // Add instructions overlay
    const overlay = popout.document.createElement('div');
    overlay.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        text-align: center;
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s;
      " id="instructions">
        <strong>📹 Virtual Camera Active</strong><br>
        Share this window in Zoom/Meet/Teams:<br>
        <em>Share Screen → Window → "Lumina Studio - Virtual Camera"</em>
        <br><br>
        <button onclick="this.parentElement.style.opacity='0'; setTimeout(() => this.parentElement.remove(), 300)" 
                style="background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 8px;">
          Got it!
        </button>
      </div>
    `;
    popout.document.body.appendChild(overlay);

    // Store reference and set up render loop for pop-out
    this.state.windowRef = popout;
    this.state.isWindowOpen = true;

    // Handle window close
    popout.addEventListener('beforeunload', () => {
      // Cancel the popout render loop
      if (this.popoutAnimationId) {
        cancelAnimationFrame(this.popoutAnimationId);
        this.popoutAnimationId = null;
      }
      this.state.windowRef = null;
      this.state.isWindowOpen = false;
      this.notifyListeners();
    });

    // Start rendering to pop-out canvas
    this.renderToPopOut(canvas);

    this.notifyListeners();
    console.log('[VirtualCamera] Pop-out window opened');
    return popout;
  }

  /**
   * Close the pop-out window
   */
  closePopOutWindow() {
    // Cancel the popout render loop
    if (this.popoutAnimationId) {
      cancelAnimationFrame(this.popoutAnimationId);
      this.popoutAnimationId = null;
    }
    
    if (this.state.windowRef && !this.state.windowRef.closed) {
      this.state.windowRef.close();
    }
    this.state.windowRef = null;
    this.state.isWindowOpen = false;
    this.notifyListeners();
  }

  /**
   * Get the current virtual camera stream for use in WebRTC
   */
  getStream(): MediaStream | null {
    return this.state.stream;
  }

  /**
   * Start WebRTC streaming for OBS Browser Source integration
   * Returns a URL that can be used in OBS Browser Source
   */
  startWebRTCStream(): string {
    if (!this.state.stream) {
      console.error('[VirtualCamera] No stream available. Call start() first.');
      return '';
    }

    // Initialize BroadcastChannel for frame sharing
    if (!this.broadcastChannel) {
      this.broadcastChannel = new BroadcastChannel('lumia-virtual-camera');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'request-frame' && this.sourceCanvas) {
          // Throttle to ~30fps
          const now = Date.now();
          if (now - this.lastBroadcastTime > 33) {
            this.sourceCanvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  this.broadcastChannel?.postMessage({
                    type: 'frame',
                    dataUrl: reader.result
                  });
                };
                reader.readAsDataURL(blob);
              }
            }, 'image/jpeg', 0.9);
            this.lastBroadcastTime = now;
          }
        }
      };
    }

    const url = `${window.location.origin}/virtual-camera.html`;
    
    this.state.webrtcUrl = url;
    this.state.isStreaming = true;
    this.notifyListeners();

    console.log('[VirtualCamera] WebRTC stream available at:', url);
    console.log('[VirtualCamera] Add this URL as a Browser Source in OBS');
    return url;
  }

  /**
   * Stop WebRTC streaming
   */
  stopWebRTCStream() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.state.webrtcUrl = undefined;
    this.state.isStreaming = false;
    this.notifyListeners();
    console.log('[VirtualCamera] WebRTC stream stopped');
  }

  /**
   * Get WebRTC stream URL for OBS Browser Source
   */
  getWebRTCUrl(): string | undefined {
    return this.state.webrtcUrl;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VirtualCameraConfig>) {
    this.state.config = { ...this.state.config, ...config };
    
    if (this.virtualCanvas) {
      this.virtualCanvas.width = this.state.config.width;
      this.virtualCanvas.height = this.state.config.height;
    }

    localStorage.setItem('lumina-virtual-camera-config', JSON.stringify(this.state.config));
    this.notifyListeners();
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
  subscribe(listener: (state: VirtualCameraState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  private startRenderLoop() {
    const render = () => {
      if (!this.state.isActive) return;

      this.renderFrame();
      this.animationId = requestAnimationFrame(render);
    };

    render();
  }

  private renderFrame() {
    if (!this.sourceCanvas || !this.virtualCanvas || !this.virtualCtx) return;
    
    // Skip if source canvas has no content
    if (this.sourceCanvas.width === 0 || this.sourceCanvas.height === 0) return;

    const { width, height, maintainAspectRatio } = this.state.config;

    // Clear
    this.virtualCtx.fillStyle = '#000';
    this.virtualCtx.fillRect(0, 0, width, height);

    if (maintainAspectRatio) {
      // Calculate aspect-ratio-preserving dimensions
      const srcAspect = this.sourceCanvas.width / this.sourceCanvas.height;
      const dstAspect = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (srcAspect > dstAspect) {
        drawHeight = width / srcAspect;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawWidth = height * srcAspect;
        offsetX = (width - drawWidth) / 2;
      }

      this.virtualCtx.drawImage(
        this.sourceCanvas,
        offsetX, offsetY,
        drawWidth, drawHeight
      );
    } else {
      this.virtualCtx.drawImage(this.sourceCanvas, 0, 0, width, height);
    }

    // Add overlay if configured
    if (this.state.config.showOverlay) {
      this.drawOverlay();
    }
  }

  private drawOverlay() {
    if (!this.virtualCtx) return;

    const { width, height, overlayPosition } = this.state.config;
    const padding = 10;
    const boxWidth = 200;
    const boxHeight = 30;

    let x = padding;
    let y = padding;

    switch (overlayPosition) {
      case 'top-right':
        x = width - boxWidth - padding;
        break;
      case 'bottom-left':
        y = height - boxHeight - padding;
        break;
      case 'bottom-right':
        x = width - boxWidth - padding;
        y = height - boxHeight - padding;
        break;
    }

    // Draw overlay background
    this.virtualCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.virtualCtx.roundRect(x, y, boxWidth, boxHeight, 4);
    this.virtualCtx.fill();

    // Draw text
    this.virtualCtx.fillStyle = '#fff';
    this.virtualCtx.font = '12px system-ui, sans-serif';
    this.virtualCtx.textAlign = 'center';
    this.virtualCtx.textBaseline = 'middle';
    this.virtualCtx.fillText('📹 Lumina Studio Pro', x + boxWidth / 2, y + boxHeight / 2);
  }

  private renderToPopOut(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const render = () => {
      // Check if window is still open
      if (!this.state.windowRef || this.state.windowRef.closed) {
        this.popoutAnimationId = null;
        return;
      }
      
      // Check if source canvas exists and has content
      if (!this.sourceCanvas || this.sourceCanvas.width === 0 || this.sourceCanvas.height === 0) {
        // Source not ready, try again next frame
        this.popoutAnimationId = requestAnimationFrame(render);
        return;
      }

      try {
        // Clear and draw source to pop-out canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate aspect-ratio-preserving dimensions (letterbox/pillarbox)
        const srcAspect = this.sourceCanvas.width / this.sourceCanvas.height;
        const dstAspect = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (srcAspect > dstAspect) {
          // Source is wider - fit to width, letterbox top/bottom
          drawHeight = canvas.width / srcAspect;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // Source is taller - fit to height, pillarbox left/right
          drawWidth = canvas.height * srcAspect;
          offsetX = (canvas.width - drawWidth) / 2;
        }
        
        ctx.drawImage(this.sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);
      } catch (e) {
        console.warn('[VirtualCamera] Pop-out render error:', e);
      }

      this.popoutAnimationId = requestAnimationFrame(render);
    };

    // Start the render loop
    this.popoutAnimationId = requestAnimationFrame(render);
  }

  /**
   * Generate instructions for setting up virtual camera in different apps
   */
  static getSetupInstructions(app: 'zoom' | 'meet' | 'teams' | 'obs' | 'discord'): string {
    const instructions = {
      zoom: `
**Zoom Setup:**
1. Open Lumina Studio Pro and click "Pop-out Window"
2. In Zoom, click the arrow next to "Start Video"
3. Select "Share Screen" → "Advanced" → "Content from 2nd Camera" 
   OR use "Share Screen" → "Window" → Select "Lumina Studio - Virtual Camera"
4. Your processed video will now appear in the call!

**Pro Tip:** Pin the pop-out window to keep it always visible.
      `,
      meet: `
**Google Meet Setup:**
1. Open Lumina Studio Pro and click "Pop-out Window"
2. In Meet, click the "Present now" button
3. Select "A window" and choose "Lumina Studio - Virtual Camera"
4. Click "Share"

**Alternative:** Use a Chrome extension like "OBS Virtual Camera" for native integration.
      `,
      teams: `
**Microsoft Teams Setup:**
1. Open Lumina Studio Pro and click "Pop-out Window"
2. In Teams, click "Share" in the meeting controls
3. Select "Window" and choose "Lumina Studio - Virtual Camera"
4. Your effects will now be visible to all participants!

**Note:** Teams may require the window to be in focus for best quality.
      `,
      obs: `
**OBS Studio Setup (Browser Source - Recommended):**
1. In Lumia Studio Pro, click "Start WebRTC Stream"
2. Copy the URL provided (e.g., http://localhost:5173/virtual-camera.html)
3. In OBS, add a new "Browser" source
4. Paste the URL and set dimensions (1920x1080 recommended)
5. The processed video will appear in OBS in real-time!

**Alternative - Window Capture:**
1. Click "Pop-out Window" in Lumia Studio Pro
2. In OBS, add a new "Window Capture" source
3. Select "Lumia Studio - Virtual Camera" window
4. Crop/resize as needed in OBS
5. Use OBS Virtual Camera to output to other apps
      `,
      discord: `
**Discord Setup:**
1. Open Lumina Studio Pro and click "Pop-out Window"
2. In Discord, start a video call
3. Click "Screen" and select "Applications"
4. Choose "Lumina Studio - Virtual Camera"
5. Click "Go Live" to share!
      `
    };

    return instructions[app] || 'Instructions not available for this application.';
  }
}

export const virtualCameraService = new VirtualCameraService();
export default virtualCameraService;
