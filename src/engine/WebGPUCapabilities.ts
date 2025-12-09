/**
 * WebGPU Capability Detection
 * Prepares for future WebGPU rendering path (2-3x performance improvement)
 */

export interface WebGPUInfo {
  supported: boolean;
  adapter: GPUAdapterInfo | null;
  features: string[];
  limits: Record<string, number>;
  preferredFormat: string | null;
}

interface GPUAdapterInfo {
  vendor?: string;
  architecture?: string;
  device?: string;
  description?: string;
}

export class WebGPUCapabilities {
  private static cachedInfo: WebGPUInfo | null = null;

  static async detect(): Promise<WebGPUInfo> {
    if (this.cachedInfo) return this.cachedInfo;

    const info: WebGPUInfo = {
      supported: false,
      adapter: null,
      features: [],
      limits: {},
      preferredFormat: null,
    };

    // Check if WebGPU is available
    if (!('gpu' in navigator)) {
      console.log('[WebGPU] Not available in this browser');
      this.cachedInfo = info;
      return info;
    }

    try {
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!adapter) {
        console.log('[WebGPU] No adapter available');
        this.cachedInfo = info;
        return info;
      }

      info.supported = true;
      info.adapter = await adapter.requestAdapterInfo?.() || {};
      info.features = Array.from(adapter.features || []);
      info.limits = {
        maxTextureDimension2D: adapter.limits?.maxTextureDimension2D || 0,
        maxTextureArrayLayers: adapter.limits?.maxTextureArrayLayers || 0,
        maxBindGroups: adapter.limits?.maxBindGroups || 0,
        maxComputeWorkgroupSizeX: adapter.limits?.maxComputeWorkgroupSizeX || 0,
        maxComputeWorkgroupSizeY: adapter.limits?.maxComputeWorkgroupSizeY || 0,
      };

      // Get preferred canvas format
      info.preferredFormat = gpu.getPreferredCanvasFormat?.() || null;

      console.log('[WebGPU] Available:', {
        vendor: info.adapter?.vendor,
        architecture: info.adapter?.architecture,
        features: info.features.length,
        preferredFormat: info.preferredFormat,
      });

    } catch (e) {
      console.warn('[WebGPU] Detection failed:', e);
    }

    this.cachedInfo = info;
    return info;
  }

  static isSupported(): boolean {
    return 'gpu' in navigator;
  }

  /**
   * Check if WebGPU would provide benefits over WebGL2
   */
  static async shouldUseWebGPU(): Promise<boolean> {
    const info = await this.detect();
    
    if (!info.supported) return false;

    // Check for compute shader support (key for video processing)
    const hasCompute = info.features.includes('shader-f16') || 
                       (info.limits.maxComputeWorkgroupSizeX ?? 0) > 0;

    // Check texture size (need at least 4K support)
    const hasLargeTextures = (info.limits.maxTextureDimension2D ?? 0) >= 4096;

    return hasCompute && hasLargeTextures;
  }

  /**
   * Get performance tier based on WebGPU capabilities
   */
  static async getPerformanceTier(): Promise<'ultra' | 'high' | 'standard'> {
    const info = await this.detect();

    if (!info.supported) return 'standard';

    const vendor = info.adapter?.vendor?.toLowerCase() ?? '';
    const arch = info.adapter?.architecture?.toLowerCase() ?? '';

    // Ultra tier: Modern discrete GPUs
    if (vendor.includes('nvidia') || vendor.includes('amd')) {
      if (arch.includes('rdna') || arch.includes('ampere') || arch.includes('ada')) {
        return 'ultra';
      }
      return 'high';
    }

    // High tier: Apple Silicon, modern Intel
    if (vendor.includes('apple') || arch.includes('xe')) {
      return 'high';
    }

    return 'standard';
  }
}

// Export singleton check
export const checkWebGPU = () => WebGPUCapabilities.detect();
