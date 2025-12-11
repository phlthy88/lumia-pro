/**
 * OffscreenCanvas capability detection and safe usage
 * Prevents Safari crashes by checking support before usage
 */

export class OffscreenCanvasService {
  private static _isSupported: boolean | null = null;

  /**
   * Reset support cache (for testing)
   */
  static resetCache(): void {
    this._isSupported = null;
  }

  /**
   * Check if OffscreenCanvas is supported in current environment
   */
  static isSupported(): boolean {
    if (this._isSupported !== null) {
      return this._isSupported;
    }

    try {
      // Check if OffscreenCanvas constructor exists
      if (typeof OffscreenCanvas === 'undefined') {
        this._isSupported = false;
        return false;
      }

      // Try to create a small OffscreenCanvas to test actual support
      const canvas = new OffscreenCanvas(1, 1);
      const ctx = canvas.getContext('2d');
      
      // Safari may have OffscreenCanvas but context creation fails
      this._isSupported = ctx !== null;
      return this._isSupported;
    } catch (error) {
      console.warn('OffscreenCanvas not supported:', error);
      this._isSupported = false;
      return false;
    }
  }

  /**
   * Create OffscreenCanvas safely or return null if not supported
   */
  static create(width: number, height: number): OffscreenCanvas | null {
    if (!this.isSupported()) {
      return null;
    }

    try {
      return new OffscreenCanvas(width, height);
    } catch (error) {
      console.warn('Failed to create OffscreenCanvas:', error);
      return null;
    }
  }

  /**
   * Get context safely with fallback
   */
  static getContext(
    canvas: OffscreenCanvas | HTMLCanvasElement,
    type: '2d' | 'webgl' | 'webgl2',
    options?: any
  ): CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext | null {
    try {
      const ctx = canvas.getContext(type, options);
      // Filter out unsupported context types
      if (ctx && (
        ctx instanceof CanvasRenderingContext2D ||
        ctx instanceof WebGLRenderingContext ||
        ctx instanceof WebGL2RenderingContext
      )) {
        return ctx;
      }
      return null;
    } catch (error) {
      console.warn(`Failed to get ${type} context:`, error);
      return null;
    }
  }
}
