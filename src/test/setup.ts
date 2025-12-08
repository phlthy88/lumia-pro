// Test setup file - requires vitest and @testing-library/react to be installed
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// 1. Mock MediaDevices API
const mockMediaDevices = {
  getUserMedia: vi.fn().mockImplementation((constraints) => {
    return Promise.resolve({
        getTracks: () => [
            { stop: vi.fn(), kind: 'video' },
            { stop: vi.fn(), kind: 'audio' }
        ],
        getVideoTracks: () => [{ stop: vi.fn(), kind: 'video' }],
        getAudioTracks: () => [{ stop: vi.fn(), kind: 'audio' }],
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

// 2. Mock WebGL context
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(contextId: any, ...args: any[]): any {
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
