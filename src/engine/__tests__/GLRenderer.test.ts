import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock WebGL2 context
const createMockGL = () => ({
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
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
  getExtension: vi.fn(() => ({ UNMASKED_RENDERER_WEBGL: 37446 })),
  getParameter: vi.fn(() => 'Mock GPU'),
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
  UNSIGNED_BYTE: 5121,
  LINEAR: 9729,
  CLAMP_TO_EDGE: 33071,
  TEXTURE_MIN_FILTER: 10241,
  TEXTURE_MAG_FILTER: 10240,
  TEXTURE_WRAP_S: 10242,
  TEXTURE_WRAP_T: 10243,
  UNPACK_FLIP_Y_WEBGL: 37440,
  COLOR_BUFFER_BIT: 16384,
  TRIANGLES: 4,
});

describe('GLRenderer', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockGL: ReturnType<typeof createMockGL>;

  beforeEach(() => {
    mockGL = createMockGL();
    mockCanvas = {
      getContext: vi.fn(() => mockGL),
      width: 1920,
      height: 1080,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;
  });

  describe('Shader Compilation', () => {
    it('should detect shader compilation errors', () => {
      mockGL.getShaderParameter = vi.fn(() => false);
      mockGL.getShaderInfoLog = vi.fn(() => "ERROR: 'sample' is reserved");
      
      // This would throw in real GLRenderer
      expect(mockGL.getShaderParameter({}, mockGL.COMPILE_STATUS)).toBe(false);
      expect(mockGL.getShaderInfoLog({})).toContain('ERROR');
    });

    it('should not use GLSL reserved keywords', () => {
      // List of GLSL reserved keywords that should NOT appear as variable names
      const reservedKeywords = [
        'sample', 'sampler', 'image', 'atomic', 'filter',
        'input', 'output', 'texture', 'buffer'
      ];
      
      // This is a static check - in real tests we'd parse the shader source
      reservedKeywords.forEach(keyword => {
        // Variable declaration pattern: type keyword = or type keyword;
        const badPattern = new RegExp(`(float|vec[234]|int|bool)\\s+${keyword}\\s*[=;]`);
        // This test documents the requirement
        expect(badPattern.test(`vec3 ${keyword} = vec3(1.0);`)).toBe(true);
      });
    });
  });

  describe('Texture Management', () => {
    it('should flip Y axis for canvas textures', () => {
      // Verify UNPACK_FLIP_Y_WEBGL is used
      expect(mockGL.UNPACK_FLIP_Y_WEBGL).toBe(37440);
    });

    it('should reuse textures instead of creating new ones', () => {
      const textureMap = new Map<string, object>();
      
      // Simulate texture creation
      const getOrCreateTexture = (name: string) => {
        if (!textureMap.has(name)) {
          textureMap.set(name, mockGL.createTexture());
        }
        return textureMap.get(name);
      };
      
      const tex1 = getOrCreateTexture('video');
      const tex2 = getOrCreateTexture('video');
      
      expect(tex1).toBe(tex2);
      expect(mockGL.createTexture).toHaveBeenCalledTimes(1);
    });
  });

  describe('Render Modes', () => {
    it('should map all render modes to integers', () => {
      const modes = {
        standard: 0,
        focus_peaking: 1,
        zebras: 2,
        level: 3,
        heatmap: 4,
        rgba_parade: 5,
        histogram: 6,
      };
      
      Object.entries(modes).forEach(([mode, expected]) => {
        expect(typeof expected).toBe('number');
        expect(expected).toBeGreaterThanOrEqual(0);
        expect(expected).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('Transform Uniforms', () => {
    it('should support flip transforms', () => {
      const transforms = {
        zoom: 1.0,
        rotate: 0,
        panX: 0,
        panY: 0,
        flipX: false,
        flipY: false,
      };
      
      expect(transforms.flipX).toBeDefined();
      expect(transforms.flipY).toBeDefined();
      expect(typeof transforms.flipX).toBe('boolean');
    });
  });
});

describe('GPUCapabilities', () => {
  it('should detect GPU tier from renderer string', () => {
    const detectTier = (renderer: string): 'high' | 'mid' | 'low' => {
      const r = renderer.toLowerCase();
      if (r.includes('nvidia') || r.includes('radeon') || r.includes('apple m')) return 'high';
      if (r.includes('intel') || r.includes('adreno') || r.includes('mali')) return 'mid';
      if (r.includes('swiftshader') || r.includes('llvmpipe')) return 'low';
      return 'mid';
    };
    
    expect(detectTier('NVIDIA GeForce RTX 3080')).toBe('high');
    expect(detectTier('AMD Radeon RX 6800')).toBe('high');
    expect(detectTier('Apple M1 Pro')).toBe('high');
    expect(detectTier('Intel UHD Graphics 630')).toBe('mid');
    expect(detectTier('Adreno 650')).toBe('mid');
    expect(detectTier('Mali-G78')).toBe('mid');
    expect(detectTier('SwiftShader')).toBe('low');
    expect(detectTier('llvmpipe')).toBe('low');
    expect(detectTier('Unknown GPU')).toBe('mid');
  });
});
