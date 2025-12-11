interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  gpuMemory: number;
  renderTime: number;
  timestamp: number;
}

interface PerformanceThresholds {
  minFps: number;
  maxFrameTime: number;
  maxMemoryUsage: number;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];
  private lastAlertTime = 0;
  private readonly ALERT_THROTTLE = 5000; // Only alert every 5 seconds
  
  // FPS tracking
  private frameCount = 0;
  private lastFPSTime = 0;
  private currentFPS = 60;
  private fpsAnimationFrame: number | null = null;
  
  private thresholds: PerformanceThresholds = {
    minFps: 15, // More realistic threshold (was 24)
    maxFrameTime: 100, // 10fps minimum (was 33.33)
    maxMemoryUsage: 512 * 1024 * 1024 // 512MB
  };

  static getInstance(): PerformanceMonitoringService {
    if (!this.instance) {
      this.instance = new PerformanceMonitoringService();
    }
    return this.instance;
  }

  startMonitoring(intervalMs = 1000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startFPSTracking();
    
    this.monitoringInterval = window.setInterval(() => {
      const metrics = this.collectMetrics();
      this.metrics.push(metrics);
      
      // Keep only last 60 samples (1 minute at 1s intervals)
      if (this.metrics.length > 60) {
        this.metrics.shift();
      }
      
      this.listeners.forEach(listener => listener(metrics));
      this.checkThresholds(metrics);
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.fpsAnimationFrame) {
      cancelAnimationFrame(this.fpsAnimationFrame);
      this.fpsAnimationFrame = null;
    }
    this.isMonitoring = false;
  }

  private startFPSTracking() {
    const trackFPS = () => {
      const now = performance.now();
      this.frameCount++;
      
      if (now - this.lastFPSTime >= 1000) {
        this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSTime));
        this.frameCount = 0;
        this.lastFPSTime = now;
      }
      
      if (this.isMonitoring) {
        this.fpsAnimationFrame = requestAnimationFrame(trackFPS);
      }
    };
    
    this.lastFPSTime = performance.now();
    this.frameCount = 0;
    trackFPS();
  }

  private collectMetrics(): PerformanceMetrics {
    const now = performance.now();
    
    // FPS calculation (simplified)
    const fps = this.calculateFPS();
    
    // Memory usage
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo?.usedJSHeapSize || 0;
    
    // GPU memory estimation
    const gpuMemory = this.estimateGPUMemory();
    
    return {
      fps,
      frameTime: fps > 0 ? 1000 / fps : 0,
      memoryUsage,
      gpuMemory,
      renderTime: this.getLastRenderTime(),
      timestamp: now
    };
  }

  private calculateFPS(): number {
    return this.currentFPS;
  }

  private estimateGPUMemory(): number {
    // Rough estimation based on canvas size and texture usage
    const canvases = document.querySelectorAll('canvas');
    let totalPixels = 0;
    
    canvases.forEach(canvas => {
      totalPixels += canvas.width * canvas.height;
    });
    
    // Assume 4 bytes per pixel (RGBA) + overhead
    return totalPixels * 4 * 1.5;
  }

  private getLastRenderTime(): number {
    // This would be set by the renderer
    return (window as any).__lastRenderTime || 0;
  }

  private checkThresholds(metrics: PerformanceMetrics) {
    const issues: string[] = [];
    
    if (metrics.fps < this.thresholds.minFps) {
      issues.push(`Low FPS: ${metrics.fps.toFixed(1)}`);
    }
    
    if (metrics.frameTime > this.thresholds.maxFrameTime) {
      issues.push(`High frame time: ${metrics.frameTime.toFixed(1)}ms`);
    }
    
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    }
    
    if (issues.length > 0) {
      this.triggerPerformanceAlert(issues);
    }
  }

  private triggerPerformanceAlert(issues: string[]) {
    const now = Date.now();
    
    // Throttle alerts to prevent spam
    if (now - this.lastAlertTime < this.ALERT_THROTTLE) {
      return;
    }
    
    this.lastAlertTime = now;
    
    // Only log in development, don't spam production
    if (process.env.NODE_ENV === 'development') {
      console.warn('Performance issues detected:', issues);
    }
    
    // Dispatch custom event for performance alerts
    window.dispatchEvent(new CustomEvent('performance-alert', {
      detail: { issues, metrics: this.getLatestMetrics() }
    }));
  }

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageMetrics(samples = 10): Partial<PerformanceMetrics> {
    const recent = this.metrics.slice(-samples);
    if (recent.length === 0) return {};
    
    return {
      fps: recent.reduce((sum, m) => sum + m.fps, 0) / recent.length,
      frameTime: recent.reduce((sum, m) => sum + m.frameTime, 0) / recent.length,
      memoryUsage: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
      renderTime: recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length
    };
  }
}

export const performanceMonitoringService = PerformanceMonitoringService.getInstance();
