import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GLRenderer } from '../GLRenderer';
import { LutService } from '../../services/LutService';
import { RenderMode, RenderParams } from '../../types';

// Augment the mock to include texImage3D
const createMockGL = () => {
  const gl = {
    // Basic WebGL2 Context
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
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
    texImage3D: vi.fn(), // Critical for LUT
    activeTexture: vi.fn(),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    pixelStorei: vi.fn(),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    drawArrays: vi.fn(),
    deleteTexture: vi.fn(),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    getExtension: vi.fn((name) => {
        if (name === 'EXT_color_buffer_float') return {};
        if (name === 'OES_texture_float_linear') return {};
        return { UNMASKED_RENDERER_WEBGL: 37446 };
    }),
    getParameter: vi.fn(() => 'Mock GPU'),
    getError: vi.fn(() => 0), // NO_ERROR
    detachShader: vi.fn(),
    deleteVertexArray: vi.fn(),
    createVertexArray: vi.fn(),
    bindVertexArray: vi.fn(),

    // Constants
    NO_ERROR: 0,
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    TEXTURE_2D: 3553,
    TEXTURE_3D: 32879,
    TEXTURE0: 33984,
    TEXTURE1: 33985,
    TEXTURE2: 33986,
    TEXTURE3: 33987,
    TEXTURE4: 33988,
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
    TRIANGLE_STRIP: 5,
    RGB8: 32849,
    RGB16F: 34843,
  };
  return gl;
};

describe('GLRenderer Integration', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockGL: ReturnType<typeof createMockGL>;
  let renderer: GLRenderer;
  let mockVideo: HTMLVideoElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGL = createMockGL();

    // Override getContext for the test canvas
    mockCanvas = {
      getContext: vi.fn((type) => {
          if (type === 'webgl2') return mockGL;
          return null;
      }),
      width: 1920,
      height: 1080,
      clientWidth: 1920,
      clientHeight: 1080,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;

    // Instantiate Renderer
    renderer = new GLRenderer(mockCanvas);

    // Mock Video Source
    mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      readyState: 2, // HAVE_CURRENT_DATA
    } as unknown as HTMLVideoElement;
  });

  afterEach(() => {
    if (renderer) renderer.dispose();
  });

  it('should apply LUT to live camera stream and render', () => {
    // 1. Setup Video Source
    renderer.setVideoSource(mockVideo);

    // 2. Generate and Set LUT (Teal & Orange)
    const lut = LutService.generateTealOrange(33);
    renderer.setLut(lut);

    // Verify texImage3D was called to upload LUT texture
    expect(mockGL.texImage3D).toHaveBeenCalled();
    const calls = (mockGL.texImage3D as any).mock.calls;
    const lastCall = calls[calls.length - 1];
    // Check if LUT data was passed (arg index 9 usually)
    // texImage3D(target, level, internalformat, width, height, depth, border, format, type, pixels)
    expect(lastCall[0]).toBe(mockGL.TEXTURE_3D);
    expect(lastCall[3]).toBe(33); // width
    expect(lastCall[4]).toBe(33); // height
    expect(lastCall[5]).toBe(33); // depth

    // 3. Define params callback
    const getParams = () => ({
        color: {
            exposure: 0,
            contrast: 1.0,
            saturation: 1.0,
            temperature: 0,
            tint: 0,
            lift: 0,
            gamma: 1.0,
            gain: 1.0,
            lutStrength: 1.0, // Full LUT strength
            highlightRoll: 0,
            shadowRoll: 0,
            vignette: 0,
            grain: 0,
            sharpness: 0,
            distortion: 0,
            denoise: 0,
            portraitLight: 0,
            highlights: 0,
            shadows: 0,
            blacks: 0,
            skinSmoothing: 0,
        },
        transform: {
            zoom: 1.0,
            rotate: 0,
            panX: 0,
            panY: 0,
            flipX: false,
            flipY: false,
        },
        mode: RenderMode.Standard,
        gyroAngle: 0,
        bypass: false,
    });

    const onStats = vi.fn();
    const onDrawOverlay = vi.fn(() => false);

    // 4. Start Renderer
    // We mock requestAnimationFrame to run loop once synchronously if possible,
    // but GLRenderer uses rAF loop. We can manually trigger a render frame by calling the loop logic
    // OR just verify the state after start if we mock requestAnimationFrame.

    // Let's mock requestAnimationFrame to execute the callback immediately once, then stop
    const originalRAF = global.requestAnimationFrame;
    const originalCancelRAF = global.cancelAnimationFrame;

    let rafCallback: FrameRequestCallback | null = null;
    global.requestAnimationFrame = vi.fn((cb) => {
        rafCallback = cb;
        return 1;
    });
    global.cancelAnimationFrame = vi.fn();

    renderer.start(getParams, onStats, onDrawOverlay);

    // Execute one frame
    if (rafCallback) {
        (rafCallback as any)(performance.now() + 100);
    }

    // 5. Verify Draw Call
    // Should draw arrays (TRIANGLE_STRIP, 0, 4)
    expect(mockGL.useProgram).toHaveBeenCalled();
    expect(mockGL.drawArrays).toHaveBeenCalledWith(mockGL.TRIANGLE_STRIP, 0, 4);

    // Verify LUT texture was bound to texture unit 2 (TEXTURE2)
    // The renderer does: activeTexture(TEXTURE2) -> bindTexture(TEXTURE_3D, lutTex)
    // We can check the sequence or just that it was called.
    expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE2);
    expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_3D, expect.anything());

    // Restore globals
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCancelRAF;
  });

  it('should dispose resources correctly', () => {
      renderer.setVideoSource(mockVideo);
      const lut = LutService.generateIdentity();
      renderer.setLut(lut);

      renderer.dispose();

      expect(mockGL.deleteProgram).toHaveBeenCalled();
      expect(mockGL.deleteTexture).toHaveBeenCalled(); // Should delete video tex, lut tex, etc.
      expect(mockGL.deleteBuffer).toHaveBeenCalled();
  });
});
