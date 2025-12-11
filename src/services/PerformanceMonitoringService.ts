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
  
  private thresholds: PerformanceThresholds = {
    minFps: 24,
    maxFrameTime: 33.33, // ~30fps
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
    this.isMonitoring = false;
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
    // Simplified FPS calculation using requestAnimationFrame
    if (this.metrics.length < 2) return 60; // Default assumption
    
    const recent = this.metrics.slice(-5);
    const avgInterval = recent.reduce((sum, metric, i) => {
      if (i === 0 || !recent[i - 1]) return sum;
      return sum + (metric.timestamp - recent[i - 1]!.timestamp);
    }, 0) / Math.max(recent.length - 1, 1);
    
    return avgInterval > 0 ? 1000 / avgInterval : 60;
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
      console.warn('Performance issues detected:', issues);
      this.triggerPerformanceAlert(issues);
    }
  }

  private triggerPerformanceAlert(issues: string[]) {
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
