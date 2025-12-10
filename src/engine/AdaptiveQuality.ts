export interface QualityState {
  tier: 'high' | 'medium' | 'low';
  resolutionScale: number;
  targetFps: number;
  beautyEnabled: boolean;
  reason?: string;
}

export class AdaptiveQuality {
  private frameTimesMs: number[] = [];
  private readonly windowSize = 150; // ~5 seconds at 30fps for smoother averages
  private consecutiveBadSamples = 0;
  private lastDownscaleTime = 0;

  addFrameTime(ms: number): void {
    this.frameTimesMs.push(ms);
    if (this.frameTimesMs.length > this.windowSize) {
      this.frameTimesMs.shift();
    }
  }

  getRecommendation(): QualityState {
    if (this.frameTimesMs.length < 30) {
      return { tier: 'high', resolutionScale: 1.0, targetFps: 60, beautyEnabled: true };
    }

    const avgMs = this.frameTimesMs.reduce((a, b) => a + b, 0) / this.frameTimesMs.length;
    const avgFps = 1000 / avgMs;

    if (avgFps < 17) {
      return {
        tier: 'low',
        resolutionScale: 0.65,
        targetFps: 30,
        beautyEnabled: false,
        reason: `Low FPS: ${avgFps.toFixed(1)}`
      };
    }

    if (avgFps < 24) {
      return {
        tier: 'medium',
        resolutionScale: 0.85,
        targetFps: 30,
        beautyEnabled: true,
        reason: `Medium FPS: ${avgFps.toFixed(1)}`
      };
    }

    return { tier: 'high', resolutionScale: 1.0, targetFps: 60, beautyEnabled: true };
  }

  shouldDownscale(): boolean {
    const rec = this.getRecommendation();
    const now = performance.now();

    if (rec.tier === 'low') {
      this.consecutiveBadSamples++;
    } else {
      this.consecutiveBadSamples = 0;
    }

    // Require a longer run of bad samples and a 6s cooldown between adjustments
    const shouldAdjust = this.consecutiveBadSamples >= 45 && now - this.lastDownscaleTime > 6000;
    if (shouldAdjust) {
      this.lastDownscaleTime = now;
    }

    return shouldAdjust;
  }

  getAverageFrameTime(): number {
    if (this.frameTimesMs.length === 0) return 0;
    return this.frameTimesMs.reduce((a, b) => a + b, 0) / this.frameTimesMs.length;
  }

  getAverageFps(): number {
    const avgMs = this.getAverageFrameTime();
    return avgMs > 0 ? 1000 / avgMs : 0;
  }

  reset(): void {
    this.frameTimesMs = [];
    this.consecutiveBadSamples = 0;
    this.lastDownscaleTime = 0;
  }
}
