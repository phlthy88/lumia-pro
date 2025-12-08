// ============================================================================
// PLATFORM BOOSTS SERVICE - Crostini Safe, HDR, WebGPU, WebGL2 Optimizations
// ============================================================================

export interface PlatformCapabilities {
  // Platform Detection
  isCrostini: boolean;
  isChromeOS: boolean;
  isLinux: boolean;
  isMac: boolean;
  isWindows: boolean;
  
  // Graphics APIs
  webgl2: WebGLCapability;
  webgpu: WebGPUCapability;
  
  // Display Features
  hdr: HDRCapability;
  colorGamut: 'srgb' | 'p3' | 'rec2020';
  refreshRate: number;
  
  // Hardware
  gpuVendor: string;
  gpuRenderer: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  
  // Media
  hardwareVideoEncode: boolean;
  hardwareVideoDecode: boolean;
  
  // Recommended Settings
  recommendedBoosts: BoostProfile;
}

export interface WebGLCapability {
  supported: boolean;
  version: string;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxViewportDims: number[];
  floatTextures: boolean;
  anisotropicFiltering: number;
  instancing: boolean;
  drawBuffers: number;
}

export interface WebGPUCapability {
  supported: boolean;
  adapterInfo: Record<string, unknown> | null;
  features: string[];
  limits: Record<string, number>;
}

export interface HDRCapability {
  supported: boolean;
  colorSpace: string;
  maxLuminance: number;
  transferFunction: 'srgb' | 'pq' | 'hlg';
}

export interface BoostProfile {
  name: string;
  renderingTier: 'performance' | 'balanced' | 'quality';
  targetFPS: number;
  useWebGPU: boolean;
  useWebGL2: boolean;
  enableHDR: boolean;
  enableHardwareAccel: boolean;
  aiProcessingMode: 'off' | 'throttled' | 'full';
  videoEncoderPreset: 'ultrafast' | 'fast' | 'medium' | 'slow';
}

// Chrome flags recommendations for different platforms
export const CHROME_FLAGS_RECOMMENDATIONS = {
  crostiniSafe: [
    {
      flag: 'ignore-gpu-blocklist',
      description: 'Allows GPU acceleration even if your GPU is blocklisted',
      safe: true,
      impact: 'high'
    },
    {
      flag: 'enable-gpu-rasterization',
      description: 'Uses GPU for page rasterization',
      safe: true,
      impact: 'medium'
    },
    {
      flag: 'enable-zero-copy',
      description: 'Zero-copy rasterizer for improved memory efficiency',
      safe: true,
      impact: 'medium'
    },
    {
      flag: 'enable-accelerated-video-decode',
      description: 'Hardware video decoding',
      safe: true,
      impact: 'high'
    },
    {
      flag: 'enable-accelerated-video-encode',
      description: 'Hardware video encoding for recordings',
      safe: true,
      impact: 'high'
    }
  ],
  webgl2Boosts: [
    {
      flag: 'use-angle=gl',
      description: 'Use OpenGL backend for ANGLE (better on Linux)',
      safe: true,
      impact: 'high'
    },
    {
      flag: 'enable-webgl2-compute-context',
      description: 'Enables WebGL2 compute shaders',
      safe: true,
      impact: 'medium'
    },
    {
      flag: 'enable-webgl-draft-extensions',
      description: 'Enables draft WebGL extensions',
      safe: false,
      impact: 'low'
    }
  ],
  webgpuBoosts: [
    {
      flag: 'enable-unsafe-webgpu',
      description: 'Enables WebGPU API',
      safe: true,
      impact: 'high'
    },
    {
      flag: 'enable-features=Vulkan',
      description: 'Use Vulkan backend for WebGPU',
      safe: true,
      impact: 'high'
    }
  ],
  hdr10Boosts: [
    {
      flag: 'enable-features=UseSkiaRenderer',
      description: 'Skia renderer with HDR support',
      safe: true,
      impact: 'medium'
    },
    {
      flag: 'force-color-profile=scrgb-linear',
      description: 'Force scRGB linear color profile for HDR',
      safe: false,
      impact: 'high'
    },
    {
      flag: 'enable-hdr',
      description: 'Enable HDR mode',
      safe: true,
      impact: 'high'
    }
  ],
  performanceBoosts: [
    {
      flag: 'enable-features=CanvasOopRasterization',
      description: 'Out-of-process canvas rasterization',
      safe: true,
      impact: 'medium'
    },
    {
      flag: 'enable-features=RawDraw',
      description: 'Raw draw for faster rendering',
      safe: true,
      impact: 'medium'
    },
    {
      flag: 'renderer-process-limit=4',
      description: 'Limit renderer processes for stability',
      safe: true,
      impact: 'low'
    }
  ]
};

class PlatformBoostsService {
  private capabilities: PlatformCapabilities | null = null;
  private boostProfile: BoostProfile | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  async detectCapabilities(): Promise<PlatformCapabilities> {
    if (this.capabilities) return this.capabilities;

    const [webgl2, webgpu, hdr] = await Promise.all([
      this.detectWebGL2(),
      this.detectWebGPU(),
      this.detectHDR()
    ]);

    const platform = this.detectPlatform();
    const gpu = this.detectGPU();
    const media = await this.detectMediaCapabilities();

    this.capabilities = {
      ...platform,
      webgl2,
      webgpu,
      hdr,
      colorGamut: this.detectColorGamut(),
      refreshRate: this.detectRefreshRate(),
      gpuVendor: gpu.vendor,
      gpuRenderer: gpu.renderer,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: (navigator as any).deviceMemory || 4,
      hardwareVideoEncode: media.encode,
      hardwareVideoDecode: media.decode,
      recommendedBoosts: this.generateRecommendedProfile(platform, gpu, webgl2, webgpu)
    };

    console.log('[PlatformBoosts] Detected capabilities:', this.capabilities);
    return this.capabilities;
  }

  private detectPlatform() {
    const ua = navigator.userAgent;
    const platform = navigator.platform.toLowerCase();
    
    const isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua);
    const isLinux = platform.includes('linux');
    const isChromeOS = /CrOS/.test(ua);
    const isCrostini = isLinux && isChrome && !isChromeOS;
    
    return {
      isCrostini,
      isChromeOS,
      isLinux,
      isMac: platform.includes('mac'),
      isWindows: platform.includes('win')
    };
  }

  private detectGPU(): { vendor: string; renderer: string } {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return { vendor: 'Unknown', renderer: 'Unknown' };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown',
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown'
      };
    }

    return {
      vendor: gl.getParameter(gl.VENDOR) || 'Unknown',
      renderer: gl.getParameter(gl.RENDERER) || 'Unknown'
    };
  }

  private detectWebGL2(): WebGLCapability {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

    if (!gl) {
      return {
        supported: false,
        version: 'none',
        maxTextureSize: 0,
        maxRenderbufferSize: 0,
        maxViewportDims: [0, 0],
        floatTextures: false,
        anisotropicFiltering: 0,
        instancing: false,
        drawBuffers: 0
      };
    }

    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    
    return {
      supported: true,
      version: gl.getParameter(gl.VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      floatTextures: !!gl.getExtension('EXT_color_buffer_float'),
      anisotropicFiltering: aniso ? gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0,
      instancing: true, // WebGL2 always supports instancing
      drawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS)
    };
  }

  private async detectWebGPU(): Promise<WebGPUCapability> {
    if (!('gpu' in navigator)) {
      return { supported: false, adapterInfo: null, features: [], limits: {} };
    }

    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        return { supported: false, adapterInfo: null, features: [], limits: {} };
      }

      const info = await adapter.requestAdapterInfo?.() || null;
      const features = Array.from(adapter.features || []) as string[];
      const limits: Record<string, number> = {};
      
      if (adapter.limits) {
        for (const key of Object.keys(Object.getPrototypeOf(adapter.limits))) {
          limits[key] = adapter.limits[key];
        }
      }

      return {
        supported: true,
        adapterInfo: info,
        features,
        limits
      };
    } catch (e) {
      console.warn('[PlatformBoosts] WebGPU detection failed:', e);
      return { supported: false, adapterInfo: null, features: [], limits: {} };
    }
  }

  private detectHDR(): HDRCapability {
    // Check for HDR support via media queries
    const supportsHDR = window.matchMedia('(dynamic-range: high)').matches;
    const supportsP3 = window.matchMedia('(color-gamut: p3)').matches;
    const supportsRec2020 = window.matchMedia('(color-gamut: rec2020)').matches;

    let colorSpace = 'srgb';
    if (supportsRec2020) colorSpace = 'rec2020';
    else if (supportsP3) colorSpace = 'display-p3';

    // Check for HDR canvas support
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { colorSpace: 'display-p3' } as any);
    const canvasHDR = ctx !== null;

    return {
      supported: supportsHDR && canvasHDR,
      colorSpace,
      maxLuminance: supportsHDR ? 1000 : 100, // Estimate
      transferFunction: supportsHDR ? 'pq' : 'srgb'
    };
  }

  private detectColorGamut(): 'srgb' | 'p3' | 'rec2020' {
    if (window.matchMedia('(color-gamut: rec2020)').matches) return 'rec2020';
    if (window.matchMedia('(color-gamut: p3)').matches) return 'p3';
    return 'srgb';
  }

  private detectRefreshRate(): number {
    // Use screen.refreshRate if available (Chrome 105+)
    if ('screen' in window && 'refreshRate' in (screen as any)) {
      return (screen as any).refreshRate;
    }
    // Default assumption
    return 60;
  }

  private async detectMediaCapabilities(): Promise<{ encode: boolean; decode: boolean }> {
    let encode = false;
    let decode = false;

    try {
      // Check hardware decode with proper codec string
      const decodeConfig = {
        type: 'file' as const,
        video: {
          contentType: 'video/webm; codecs="vp09.00.10.08"',
          width: 1920,
          height: 1080,
          bitrate: 5000000,
          framerate: 60
        }
      };
      const decodeResult = await navigator.mediaCapabilities.decodingInfo(decodeConfig);
      decode = decodeResult.powerEfficient;

      // Check hardware encode via MediaRecorder
      encode = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
               MediaRecorder.isTypeSupported('video/webm;codecs=h264');
    } catch (e) {
      console.warn('[PlatformBoosts] Media capabilities detection failed:', e);
    }

    return { encode, decode };
  }

  private generateRecommendedProfile(
    platform: ReturnType<typeof this.detectPlatform>,
    gpu: { vendor: string; renderer: string },
    webgl2: WebGLCapability,
    webgpu: WebGPUCapability
  ): BoostProfile {
    const isLowEnd = 
      navigator.hardwareConcurrency <= 4 ||
      (navigator as any).deviceMemory <= 4 ||
      gpu.renderer.toLowerCase().includes('intel');

    const isHighEnd =
      navigator.hardwareConcurrency >= 8 &&
      (navigator as any).deviceMemory >= 8 &&
      (gpu.renderer.toLowerCase().includes('nvidia') || 
       gpu.renderer.toLowerCase().includes('amd') ||
       gpu.renderer.toLowerCase().includes('apple'));

    // Crostini-specific optimizations
    if (platform.isCrostini) {
      return {
        name: 'Crostini Optimized',
        renderingTier: 'balanced',
        targetFPS: 30,
        useWebGPU: false, // WebGPU often unstable in Crostini
        useWebGL2: webgl2.supported,
        enableHDR: false, // HDR passthrough unreliable
        enableHardwareAccel: true,
        aiProcessingMode: 'throttled',
        videoEncoderPreset: 'fast'
      };
    }

    // High-end system
    if (isHighEnd) {
      return {
        name: 'High Performance',
        renderingTier: 'quality',
        targetFPS: 60,
        useWebGPU: webgpu.supported,
        useWebGL2: webgl2.supported,
        enableHDR: true,
        enableHardwareAccel: true,
        aiProcessingMode: 'full',
        videoEncoderPreset: 'medium'
      };
    }

    // Low-end system
    if (isLowEnd) {
      return {
        name: 'Power Saver',
        renderingTier: 'performance',
        targetFPS: 30,
        useWebGPU: false,
        useWebGL2: webgl2.supported,
        enableHDR: false,
        enableHardwareAccel: true,
        aiProcessingMode: 'off',
        videoEncoderPreset: 'ultrafast'
      };
    }

    // Default balanced
    return {
      name: 'Balanced',
      renderingTier: 'balanced',
      targetFPS: 60,
      useWebGPU: webgpu.supported,
      useWebGL2: webgl2.supported,
      enableHDR: false,
      enableHardwareAccel: true,
      aiProcessingMode: 'throttled',
      videoEncoderPreset: 'fast'
    };
  }

  getRecommendedFlags(): typeof CHROME_FLAGS_RECOMMENDATIONS {
    if (!this.capabilities) {
      return CHROME_FLAGS_RECOMMENDATIONS;
    }

    // Filter to only safe flags for detected platform
    const flags = { ...CHROME_FLAGS_RECOMMENDATIONS };

    if (this.capabilities.isCrostini) {
      // Remove unsafe flags for Crostini
      flags.webgl2Boosts = flags.webgl2Boosts.filter(f => f.safe);
      flags.hdr10Boosts = flags.hdr10Boosts.filter(f => f.safe);
    }

    return flags;
  }

  generateFlagsScript(): string {
    const flags = this.getRecommendedFlags();
    const allFlags = [
      ...flags.crostiniSafe,
      ...flags.webgl2Boosts.filter(f => f.safe),
      ...flags.webgpuBoosts.filter(f => f.safe),
      ...flags.performanceBoosts.filter(f => f.safe)
    ];

    const flagString = allFlags.map(f => `--${f.flag}`).join(' ');
    
    return `#!/bin/bash
# Lumina Studio Pro - Optimized Chrome Launch Script
# Generated for your system configuration

# Launch Chrome/Chromium with optimized flags
google-chrome ${flagString} "$@"

# Or for Chromium:
# chromium-browser ${flagString} "$@"
`;
  }

  getCapabilities(): PlatformCapabilities | null {
    return this.capabilities;
  }

  setBoostProfile(profile: BoostProfile) {
    this.boostProfile = profile;
    // Debounce localStorage writes to prevent flooding
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      localStorage.setItem('lumina-boost-profile', JSON.stringify(profile));
    }, 500);
  }

  getBoostProfile(): BoostProfile | null {
    if (this.boostProfile) return this.boostProfile;
    
    const saved = localStorage.getItem('lumina-boost-profile');
    if (saved) {
      this.boostProfile = JSON.parse(saved);
      return this.boostProfile;
    }
    
    return this.capabilities?.recommendedBoosts || null;
  }
}

export const platformBoostsService = new PlatformBoostsService();
export default platformBoostsService;
