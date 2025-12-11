// Test setup file - requires vitest and @testing-library/react to be installed
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Helper to create a mock MediaStreamTrack
const createMockTrack = (kind: 'video' | 'audio') => ({
    kind,
    stop: vi.fn(),
    getSettings: vi.fn(() => ({ width: 1920, height: 1080, frameRate: 30, deviceId: 'test-device' })),
    getCapabilities: vi.fn(() => ({})),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
});

// 1. Mock MediaDevices API
const mockMediaDevices = {
  getUserMedia: vi.fn().mockImplementation((constraints) => {
    return Promise.resolve({
        getTracks: () => [
            createMockTrack('video'),
            createMockTrack('audio')
        ],
        getVideoTracks: () => [createMockTrack('video')],
        getAudioTracks: () => [createMockTrack('audio')],
    } as unknown as MediaStream);
  }),
  enumerateDevices: vi.fn().mockResolvedValue([
      { deviceId: 'cam1', kind: 'videoinput', label: 'Camera 1' },
      { deviceId: 'mic1', kind: 'audioinput', label: 'Mic 1' }
  ]),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: mockMediaDevices
});

// 2. Mock Canvas contexts (2D and WebGL2)
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(contextId: any, ...args: any[]): any {
    if (contextId === '2d') {
      // Return a mock 2D context
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
        putImageData: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        translate: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        canvas: this,
      } as unknown as CanvasRenderingContext2D;
    }
    if (contextId === 'webgl2') {
        // Return a mock WebGL2 context
      return {
          getExtension: vi.fn(),
          getParameter: vi.fn((param) => {
              if (param === 37446) return 'High Performance GPU'; // RENDERER
              return 0;
          }),
          createShader: vi.fn(),
          shaderSource: vi.fn(),
          compileShader: vi.fn(),
          getShaderParameter: vi.fn(() => true),
          createProgram: vi.fn(),
          attachShader: vi.fn(),
          linkProgram: vi.fn(),
          getProgramParameter: vi.fn(() => true),
          useProgram: vi.fn(),
          createBuffer: vi.fn(),
          bindBuffer: vi.fn(),
          bufferData: vi.fn(),
          enableVertexAttribArray: vi.fn(),
          vertexAttribPointer: vi.fn(),
          clearColor: vi.fn(),
          clear: vi.fn(),
          drawArrays: vi.fn(),
          createTexture: vi.fn(),
          bindTexture: vi.fn(),
          texImage2D: vi.fn(),
          texParameteri: vi.fn(),
          activeTexture: vi.fn(),
          uniform1i: vi.fn(),
          uniform1f: vi.fn(),
          uniform2f: vi.fn(),
          uniformMatrix4fv: vi.fn(),
          getUniformLocation: vi.fn(() => ({})),
          getAttribLocation: vi.fn(() => 0),
          viewport: vi.fn(),
          enable: vi.fn(),
          blendFunc: vi.fn(),
          deleteProgram: vi.fn(),
          deleteShader: vi.fn(),
          deleteTexture: vi.fn(),
          deleteBuffer: vi.fn(),
      } as unknown as WebGL2RenderingContext;
    }
    return originalGetContext.call(this, contextId as any, ...args);
  };
}

// 3. Mock RequestMIDIAccess
Object.defineProperty(global.navigator, 'requestMIDIAccess', {
    writable: true,
    value: vi.fn().mockResolvedValue({
        inputs: new Map(),
        outputs: new Map(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })
});

// 4. Mock MediaRecorder
class MockMediaRecorder {
    state: string = 'inactive';
    mimeType: string = 'video/webm';

    constructor(stream: MediaStream, options?: MediaRecorderOptions) {
        this.mimeType = options?.mimeType || 'video/webm';
    }

    start() { this.state = 'recording'; }
    stop() {
        this.state = 'inactive';
        if (this.onstop) this.onstop(new Event('stop'));
    }
    pause() { this.state = 'paused'; }
    resume() { this.state = 'recording'; }
    requestData() {}

    static isTypeSupported(type: string) { return true; }

    ondataavailable: ((e: BlobEvent) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    onstop: ((e: Event) => void) | null = null;
}

Object.defineProperty(global.window, 'MediaRecorder', {
    writable: true,
    value: MockMediaRecorder
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}

    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
};

class MockOffscreenCanvas {
    constructor(width: number, height: number) {}
    getContext(contextId: string, options?: any) {
        return {
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            getImageData: vi.fn(),
            putImageData: vi.fn(),
            createImageData: vi.fn(),
            setTransform: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            arc: vi.fn(),
            ellipse: vi.fn(),
        };
    }
}
vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas);


// Mock MediaStream
const mockTracks = [
  createMockTrack('video'),
  createMockTrack('audio')
];

class MockMediaStream {
  private tracks: any[];
  
  constructor(tracks?: any[]) {
    this.tracks = tracks || mockTracks;
  }
  
  getTracks() { return this.tracks; }
  getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); }
  getAudioTracks() { return this.tracks.filter(t => t.kind === 'audio'); }
  addTrack(track: any) { this.tracks.push(track); }
  removeTrack(track: any) { 
    const index = this.tracks.indexOf(track);
    if (index > -1) this.tracks.splice(index, 1);
  }
}

Object.defineProperty(global, 'MediaStream', {
  writable: true,
  value: MockMediaStream
});

// Add memory cleanup after each test
afterEach(() => {
  // Clear all mock implementations to release memory
  vi.clearAllMocks();
  
  // Clear module registry to prevent memory leaks
  vi.resetModules();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Global cleanup after all tests
afterAll(() => {
  // Clean up any remaining resources
  vi.restoreAllMocks();
  
  // Force final garbage collection
  if (global.gc) {
    global.gc();
  }
});

// Import memory cleanup
import './after-test-cleanup'

// Add HTMLCanvasElement mock for tests that need captureStream
if (typeof HTMLCanvasElement !== 'undefined') {
  if (!HTMLCanvasElement.prototype.captureStream) {
    HTMLCanvasElement.prototype.captureStream = vi.fn(() => new MediaStream());
  }
  if (!HTMLCanvasElement.prototype.toBlob) {
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob(['test'])));
  }
}
