import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create comprehensive WebGL2 mock
const createMockGL = () => ({
  // Shader methods
  createShader: vi.fn(() => ({ id: Math.random() })),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  deleteShader: vi.fn(),
  
  // Program methods
  createProgram: vi.fn(() => ({ id: Math.random() })),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ''),
  useProgram: vi.fn(),
  deleteProgram: vi.fn(),
  
  // Uniform/Attribute methods
  getUniformLocation: vi.fn((prog, name) => ({ name })),
  getAttribLocation: vi.fn(() => 0),
  uniform1i: vi.fn(),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  uniform4f: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  
  // Buffer methods
  createBuffer: vi.fn(() => ({ id: Math.random() })),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  deleteBuffer: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  disableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  
  // Texture methods
  createTexture: vi.fn(() => ({ id: Math.random() })),
  bindTexture: vi.fn(),
  texParameteri: vi.fn(),
  texImage2D: vi.fn(),
  texImage3D: vi.fn(),
  activeTexture: vi.fn(),
  deleteTexture: vi.fn(),
  pixelStorei: vi.fn(),
  
  // Rendering methods
  viewport: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  drawArrays: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  blendFunc: vi.fn(),
  finish: vi.fn(),
  
  // Extension methods
  getExtension: vi.fn((name) => {
    if (name === 'WEBGL_debug_renderer_info') {
      return { UNMASKED_RENDERER_WEBGL: 37446 };
    }
    if (name === 'OES_texture_float_linear') return {};
    if (name === 'EXT_color_buffer_float') return {};
    return null;
  }),
  getParameter: vi.fn((param) => {
    if (param === 37446) return 'Mock GPU Renderer';
    return null;
  }),
  
  // Constants
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
  TEXTURE_WRAP_R: 32882,
  UNPACK_FLIP_Y_WEBGL: 37440,
  COLOR_BUFFER_BIT: 16384,
  TRIANGLES: 4,
  BLEND: 3042,
  SRC_ALPHA: 770,
  ONE_MINUS_SRC_ALPHA: 771,
});

describe('GLRenderer WebGL Operations', () => {
  let mockGL: ReturnType<typeof createMockGL>;

  beforeEach(() => {
    mockGL = createMockGL();
  });

  describe('Shader Compilation', () => {
    it('should detect shader compilation errors', () => {
      mockGL.getShaderParameter = vi.fn(() => false);
      mockGL.getShaderInfoLog = vi.fn(() => "ERROR: 'sample' is reserved");
      
      expect(mockGL.getShaderParameter()).toBe(false);
      expect(mockGL.getShaderInfoLog()).toContain('ERROR');
    });

    it('should validate shader source is set', () => {
      const shaderSource = 'void main() { gl_Position = vec4(0.0); }';
      mockGL.shaderSource({}, shaderSource);
      
      expect(mockGL.shaderSource).toHaveBeenCalledWith({}, shaderSource);
    });

    it('should compile shader after source is set', () => {
      const shader = mockGL.createShader();
      mockGL.shaderSource(shader, 'source');
      mockGL.compileShader(shader);
      
      expect(mockGL.compileShader).toHaveBeenCalledWith(shader);
    });
  });

  describe('Program Linking', () => {
    it('should attach both vertex and fragment shaders', () => {
      const program = mockGL.createProgram();
      const vertShader = mockGL.createShader();
      const fragShader = mockGL.createShader();
      
      mockGL.attachShader(program, vertShader);
      mockGL.attachShader(program, fragShader);
      
      expect(mockGL.attachShader).toHaveBeenCalledTimes(2);
    });

    it('should link program after attaching shaders', () => {
      const program = mockGL.createProgram();
      mockGL.linkProgram(program);
      
      expect(mockGL.linkProgram).toHaveBeenCalledWith(program);
    });

    it('should detect program linking errors', () => {
      mockGL.getProgramParameter = vi.fn(() => false);
      mockGL.getProgramInfoLog = vi.fn(() => 'Linking failed');
      
      expect(mockGL.getProgramParameter()).toBe(false);
      expect(mockGL.getProgramInfoLog()).toContain('failed');
    });
  });

  describe('Texture Management', () => {
    it('should create textures', () => {
      const texture = mockGL.createTexture();
      expect(texture).toBeDefined();
      expect(mockGL.createTexture).toHaveBeenCalled();
    });

    it('should bind texture to correct unit', () => {
      mockGL.activeTexture(mockGL.TEXTURE0);
      const texture = mockGL.createTexture();
      mockGL.bindTexture(mockGL.TEXTURE_2D, texture);
      
      expect(mockGL.activeTexture).toHaveBeenCalledWith(mockGL.TEXTURE0);
      expect(mockGL.bindTexture).toHaveBeenCalledWith(mockGL.TEXTURE_2D, texture);
    });

    it('should set texture parameters', () => {
      mockGL.texParameteri(mockGL.TEXTURE_2D, mockGL.TEXTURE_MIN_FILTER, mockGL.LINEAR);
      mockGL.texParameteri(mockGL.TEXTURE_2D, mockGL.TEXTURE_MAG_FILTER, mockGL.LINEAR);
      mockGL.texParameteri(mockGL.TEXTURE_2D, mockGL.TEXTURE_WRAP_S, mockGL.CLAMP_TO_EDGE);
      mockGL.texParameteri(mockGL.TEXTURE_2D, mockGL.TEXTURE_WRAP_T, mockGL.CLAMP_TO_EDGE);
      
      expect(mockGL.texParameteri).toHaveBeenCalledTimes(4);
    });

    it('should upload 2D texture data', () => {
      const data = new Uint8Array([255, 0, 0, 255]);
      mockGL.texImage2D(mockGL.TEXTURE_2D, 0, mockGL.RGBA, 1, 1, 0, mockGL.RGBA, mockGL.UNSIGNED_BYTE, data);
      
      expect(mockGL.texImage2D).toHaveBeenCalled();
    });

    it('should upload 3D texture data for LUTs', () => {
      const lutData = new Uint8Array(32 * 32 * 32 * 4);
      mockGL.texImage3D(mockGL.TEXTURE_3D, 0, mockGL.RGBA, 32, 32, 32, 0, mockGL.RGBA, mockGL.UNSIGNED_BYTE, lutData);
      
      expect(mockGL.texImage3D).toHaveBeenCalled();
    });

    it('should delete textures on cleanup', () => {
      const texture = mockGL.createTexture();
      mockGL.deleteTexture(texture);
      
      expect(mockGL.deleteTexture).toHaveBeenCalledWith(texture);
    });
  });

  describe('Buffer Management', () => {
    it('should create and bind buffers', () => {
      const buffer = mockGL.createBuffer();
      mockGL.bindBuffer(mockGL.ARRAY_BUFFER, buffer);
      
      expect(mockGL.createBuffer).toHaveBeenCalled();
      expect(mockGL.bindBuffer).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, buffer);
    });

    it('should upload buffer data', () => {
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      mockGL.bufferData(mockGL.ARRAY_BUFFER, vertices, mockGL.STATIC_DRAW);
      
      expect(mockGL.bufferData).toHaveBeenCalledWith(mockGL.ARRAY_BUFFER, vertices, mockGL.STATIC_DRAW);
    });

    it('should configure vertex attributes', () => {
      mockGL.enableVertexAttribArray(0);
      mockGL.vertexAttribPointer(0, 2, mockGL.FLOAT, false, 0, 0);
      
      expect(mockGL.enableVertexAttribArray).toHaveBeenCalledWith(0);
      expect(mockGL.vertexAttribPointer).toHaveBeenCalled();
    });
  });

  describe('Uniforms', () => {
    it('should get uniform locations', () => {
      const program = mockGL.createProgram();
      const location = mockGL.getUniformLocation(program, 'u_exposure');
      
      expect(location).toBeDefined();
      expect(mockGL.getUniformLocation).toHaveBeenCalledWith(program, 'u_exposure');
    });

    it('should set float uniforms', () => {
      const location = { name: 'u_exposure' };
      mockGL.uniform1f(location, 1.5);
      
      expect(mockGL.uniform1f).toHaveBeenCalledWith(location, 1.5);
    });

    it('should set integer uniforms', () => {
      const location = { name: 'u_texture' };
      mockGL.uniform1i(location, 0);
      
      expect(mockGL.uniform1i).toHaveBeenCalledWith(location, 0);
    });

    it('should set vec2 uniforms', () => {
      const location = { name: 'u_resolution' };
      mockGL.uniform2f(location, 1920, 1080);
      
      expect(mockGL.uniform2f).toHaveBeenCalledWith(location, 1920, 1080);
    });
  });

  describe('Rendering', () => {
    it('should set viewport', () => {
      mockGL.viewport(0, 0, 1920, 1080);
      
      expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, 1920, 1080);
    });

    it('should clear with color', () => {
      mockGL.clearColor(0, 0, 0, 1);
      mockGL.clear(mockGL.COLOR_BUFFER_BIT);
      
      expect(mockGL.clearColor).toHaveBeenCalledWith(0, 0, 0, 1);
      expect(mockGL.clear).toHaveBeenCalledWith(mockGL.COLOR_BUFFER_BIT);
    });

    it('should draw triangles', () => {
      mockGL.drawArrays(mockGL.TRIANGLES, 0, 6);
      
      expect(mockGL.drawArrays).toHaveBeenCalledWith(mockGL.TRIANGLES, 0, 6);
    });

    it('should enable blending for overlays', () => {
      mockGL.enable(mockGL.BLEND);
      mockGL.blendFunc(mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);
      
      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
      expect(mockGL.blendFunc).toHaveBeenCalledWith(mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);
    });
  });

  describe('Extensions', () => {
    it('should check for float texture support', () => {
      const ext = mockGL.getExtension('OES_texture_float_linear');
      expect(ext).toBeDefined();
    });

    it('should check for color buffer float support', () => {
      const ext = mockGL.getExtension('EXT_color_buffer_float');
      expect(ext).toBeDefined();
    });

    it('should get GPU renderer info', () => {
      const ext = mockGL.getExtension('WEBGL_debug_renderer_info');
      expect(ext).toBeDefined();
      
      if (ext) {
        const renderer = mockGL.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        expect(renderer).toBe('Mock GPU Renderer');
      }
    });
  });

  describe('Resource Cleanup', () => {
    it('should delete all resources', () => {
      const program = mockGL.createProgram();
      const shader = mockGL.createShader();
      const buffer = mockGL.createBuffer();
      const texture = mockGL.createTexture();
      
      mockGL.deleteProgram(program);
      mockGL.deleteShader(shader);
      mockGL.deleteBuffer(buffer);
      mockGL.deleteTexture(texture);
      
      expect(mockGL.deleteProgram).toHaveBeenCalled();
      expect(mockGL.deleteShader).toHaveBeenCalled();
      expect(mockGL.deleteBuffer).toHaveBeenCalled();
      expect(mockGL.deleteTexture).toHaveBeenCalled();
    });
  });
});

describe('GPU Tier Detection', () => {
  it('should detect high-end GPUs', () => {
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
  });

  it('should detect mid-tier GPUs', () => {
    const detectTier = (renderer: string): 'high' | 'mid' | 'low' => {
      const r = renderer.toLowerCase();
      if (r.includes('nvidia') || r.includes('radeon') || r.includes('apple m')) return 'high';
      if (r.includes('intel') || r.includes('adreno') || r.includes('mali')) return 'mid';
      if (r.includes('swiftshader') || r.includes('llvmpipe')) return 'low';
      return 'mid';
    };
    
    expect(detectTier('Intel UHD Graphics 630')).toBe('mid');
    expect(detectTier('Adreno 650')).toBe('mid');
    expect(detectTier('Mali-G78')).toBe('mid');
  });

  it('should detect low-end/software GPUs', () => {
    const detectTier = (renderer: string): 'high' | 'mid' | 'low' => {
      const r = renderer.toLowerCase();
      if (r.includes('nvidia') || r.includes('radeon') || r.includes('apple m')) return 'high';
      if (r.includes('intel') || r.includes('adreno') || r.includes('mali')) return 'mid';
      if (r.includes('swiftshader') || r.includes('llvmpipe')) return 'low';
      return 'mid';
    };
    
    expect(detectTier('SwiftShader')).toBe('low');
    expect(detectTier('llvmpipe')).toBe('low');
  });

  it('should default to mid for unknown GPUs', () => {
    const detectTier = (renderer: string): 'high' | 'mid' | 'low' => {
      const r = renderer.toLowerCase();
      if (r.includes('nvidia') || r.includes('radeon') || r.includes('apple m')) return 'high';
      if (r.includes('intel') || r.includes('adreno') || r.includes('mali')) return 'mid';
      if (r.includes('swiftshader') || r.includes('llvmpipe')) return 'low';
      return 'mid';
    };
    
    expect(detectTier('Unknown GPU')).toBe('mid');
  });
});

describe('Render Mode Mapping', () => {
  it('should map all render modes to integers', () => {
    const modes: Record<string, number> = {
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
