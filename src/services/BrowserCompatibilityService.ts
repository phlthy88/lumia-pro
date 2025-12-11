interface CompatibilityResult {
  isSupported: boolean;
  missingFeatures: string[];
  warnings: string[];
  fallbackMode: boolean;
}

interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
}

class BrowserCompatibilityService {
  private static instance: BrowserCompatibilityService;
  private compatibilityResult: CompatibilityResult | null = null;

  static getInstance(): BrowserCompatibilityService {
    if (!this.instance) {
      this.instance = new BrowserCompatibilityService();
    }
    return this.instance;
  }

  checkCompatibility(): CompatibilityResult {
    if (this.compatibilityResult) {
      return this.compatibilityResult;
    }

    const missingFeatures: string[] = [];
    const warnings: string[] = [];

    // Critical features
    if (!this.hasWebGL2()) missingFeatures.push('WebGL 2.0');
    if (!this.hasMediaDevices()) missingFeatures.push('MediaDevices API');
    if (!this.hasWebAssembly()) missingFeatures.push('WebAssembly');
    
    // Performance features
    if (!this.hasOffscreenCanvas()) warnings.push('OffscreenCanvas not available');
    if (!this.hasWebWorkers()) warnings.push('Web Workers limited');
    if (!this.hasWebCodecs()) warnings.push('WebCodecs not available');

    const browserInfo = this.getBrowserInfo();
    if (!browserInfo.isSupported) {
      warnings.push(`${browserInfo.name} ${browserInfo.version} has limited support`);
    }

    this.compatibilityResult = {
      isSupported: missingFeatures.length === 0,
      missingFeatures,
      warnings,
      fallbackMode: warnings.length > 0 || !browserInfo.isSupported
    };

    return this.compatibilityResult;
  }

  private hasWebGL2(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch {
      return false;
    }
  }

  private hasMediaDevices(): boolean {
    return !!(navigator.mediaDevices?.getUserMedia);
  }

  private hasWebAssembly(): boolean {
    return typeof WebAssembly === 'object';
  }

  private hasOffscreenCanvas(): boolean {
    return typeof OffscreenCanvas !== 'undefined';
  }

  private hasWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
  }

  private hasWebCodecs(): boolean {
    return 'VideoEncoder' in window;
  }

  private getBrowserInfo(): BrowserInfo {
    const ua = navigator.userAgent;
    
    if (ua.includes('Chrome/')) {
      const version = parseInt(ua.match(/Chrome\/(\d+)/)?.[1] || '0');
      return { name: 'Chrome', version: version.toString(), isSupported: version >= 90 };
    }
    
    if (ua.includes('Firefox/')) {
      const version = parseInt(ua.match(/Firefox\/(\d+)/)?.[1] || '0');
      return { name: 'Firefox', version: version.toString(), isSupported: version >= 88 };
    }
    
    if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      const version = parseInt(ua.match(/Version\/(\d+)/)?.[1] || '0');
      return { name: 'Safari', version: version.toString(), isSupported: version >= 14 };
    }
    
    if (ua.includes('Edge/')) {
      const version = parseInt(ua.match(/Edge\/(\d+)/)?.[1] || '0');
      return { name: 'Edge', version: version.toString(), isSupported: version >= 90 };
    }

    return { name: 'Unknown', version: '0', isSupported: false };
  }

  getFallbackConfig() {
    const result = this.checkCompatibility();
    
    return {
      disableWebGL2: !this.hasWebGL2(),
      disableOffscreenCanvas: !this.hasOffscreenCanvas(),
      disableWebWorkers: !this.hasWebWorkers(),
      reduceQuality: result.fallbackMode,
      maxResolution: result.fallbackMode ? { width: 1280, height: 720 } : null
    };
  }
}

export const browserCompatibilityService = BrowserCompatibilityService.getInstance();
