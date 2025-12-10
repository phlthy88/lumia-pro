import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('GLRenderer disposal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles dispose without throwing', async () => {
    const mockGL = {
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      getShaderInfoLog: vi.fn(() => ''),
      createProgram: vi.fn(() => ({})),
      attachShader: vi.fn(),
      detachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getProgramInfoLog: vi.fn(() => ''),
      useProgram: vi.fn(),
      getUniformLocation: vi.fn(() => ({})),
      getAttribLocation: vi.fn(() => 0),
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      createTexture: vi.fn(() => ({})),
      bindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texImage2D: vi.fn(),
      texImage3D: vi.fn(),
      activeTexture: vi.fn(),
      uniform1i: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      pixelStorei: vi.fn(),
      viewport: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      drawArrays: vi.fn(),
      deleteTexture: vi.fn(),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      deleteBuffer: vi.fn(),
      getExtension: vi.fn(() => ({ UNMASKED_RENDERER_WEBGL: 37446 })),
      getParameter: vi.fn(() => 'Mock GPU'),
      isContextLost: vi.fn(() => false),
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS: 35713,
      LINK_STATUS: 35714,
      TEXTURE_2D: 3553,
      TEXTURE_3D: 32879,
      TEXTURE0: 33984,
      ARRAY_BUFFER: 34962,
      STATIC_DRAW: 35044,
      FLOAT: 5126,
      RGBA: 6408,
      RGB: 6407,
      UNSIGNED_BYTE: 5121,
      LINEAR: 9729,
      CLAMP_TO_EDGE: 33071,
      TEXTURE_MIN_FILTER: 10241,
      TEXTURE_MAG_FILTER: 10240,
      TEXTURE_WRAP_S: 10242,
      TEXTURE_WRAP_T: 10243,
      TEXTURE_WRAP_R: 32882,
      UNPACK_FLIP_Y_WEBGL: 37440,
      COLOR_BUFFER_BIT: 16384,
      TRIANGLES: 4,
    };

    // Store original and override before importing
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const mockGetContext = vi.fn(() => mockGL) as typeof HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: mockGetContext, writable: true });

    const { GLRenderer } = await import('../GLRenderer');
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;

    const renderer = new GLRenderer(canvas);

    expect(() => {
      renderer.dispose();
    }).not.toThrow();

    // Restore
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: originalGetContext, writable: true });
  });
});
