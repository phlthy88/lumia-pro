// Test setup file - requires vitest and @testing-library/react to be installed
// Run: npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom

// Mock MediaDevices API
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: () => Promise.resolve({} as MediaStream),
    enumerateDevices: () => Promise.resolve([]),
    addEventListener: () => {},
    removeEventListener: () => {},
  }
});

// Mock WebGL context
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(contextId: any, ...args: any[]): any {
    if (contextId === 'webgl2') {
      return {} as WebGL2RenderingContext;
    }
    return originalGetContext.call(this, contextId as any, ...args);
  };
}

