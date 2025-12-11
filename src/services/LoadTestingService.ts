interface LoadTestConfig {
  duration: number;
  concurrency: number;
  targetFPS: number;
  memoryLimit: number;
}

interface LoadTestResult {
  passed: boolean;
  averageFPS: number;
  peakMemory: number;
  errors: string[];
  duration: number;
}

class LoadTestingService {
  private static instance: LoadTestingService;
  private isRunning = false;

  static getInstance(): LoadTestingService {
    if (!this.instance) {
      this.instance = new LoadTestingService();
    }
    return this.instance;
  }

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }

    this.isRunning = true;
    const startTime = performance.now();
    const errors: string[] = [];
    const fpsReadings: number[] = [];
    let peakMemory = 0;

    try {
      // Start performance monitoring
      const monitoringInterval = setInterval(() => {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          peakMemory = Math.max(peakMemory, memInfo.usedJSHeapSize);
        }

        // Simulate FPS reading (in real implementation, get from renderer)
        const currentFPS = this.getCurrentFPS();
        fpsReadings.push(currentFPS);

        if (currentFPS < config.targetFPS * 0.8) {
          errors.push(`Low FPS detected: ${currentFPS}`);
        }

        if (memInfo && memInfo.usedJSHeapSize > config.memoryLimit) {
          errors.push(`Memory limit exceeded: ${memInfo.usedJSHeapSize}`);
        }
      }, 100);

      // Simulate concurrent load
      const loadPromises = Array.from({ length: config.concurrency }, (_, i) => 
        this.simulateUserSession(config.duration / config.concurrency, i)
      );

      await Promise.all(loadPromises);
      
      // Wait for full duration
      await new Promise(resolve => setTimeout(resolve, config.duration));
      
      clearInterval(monitoringInterval);

      const averageFPS = fpsReadings.reduce((sum, fps) => sum + fps, 0) / fpsReadings.length;
      const duration = performance.now() - startTime;

      return {
        passed: errors.length === 0 && averageFPS >= config.targetFPS * 0.9,
        averageFPS,
        peakMemory,
        errors,
        duration
      };

    } catch (error) {
      errors.push(`Load test error: ${error}`);
      return {
        passed: false,
        averageFPS: 0,
        peakMemory,
        errors,
        duration: performance.now() - startTime
      };
    } finally {
      this.isRunning = false;
    }
  }

  private async simulateUserSession(duration: number, _sessionId: number): Promise<void> {
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      // Simulate user interactions
      await this.simulateColorGrading();
      await this.simulateLUTChange();
      await this.simulateRecording();
      
      // Random delay between actions
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    }
  }

  private async simulateColorGrading(): Promise<void> {
    // Simulate color grading parameter changes
    const params = {
      exposure: Math.random() * 2 - 1,
      contrast: Math.random() * 2 - 1,
      saturation: Math.random() * 2 - 1
    };
    
    // Trigger color grading update (would call actual service)
    window.dispatchEvent(new CustomEvent('color-grading-update', { detail: params }));
  }

  private async simulateLUTChange(): Promise<void> {
    // Simulate LUT loading
    const lutNames = ['cinematic', 'vintage', 'modern', 'film'];
    const randomLUT = lutNames[Math.floor(Math.random() * lutNames.length)];
    
    window.dispatchEvent(new CustomEvent('lut-change', { detail: { name: randomLUT } }));
  }

  private async simulateRecording(): Promise<void> {
    // Simulate recording start/stop
    if (Math.random() > 0.7) {
      window.dispatchEvent(new CustomEvent('recording-toggle'));
    }
  }

  private getCurrentFPS(): number {
    // In real implementation, get from performance monitoring service
    return 60 - Math.random() * 10; // Simulate FPS between 50-60
  }

  getRecommendedConfig(): LoadTestConfig {
    return {
      duration: 30000, // 30 seconds
      concurrency: 3,
      targetFPS: 30,
      memoryLimit: 512 * 1024 * 1024 // 512MB
    };
  }
}

export const loadTestingService = LoadTestingService.getInstance();
