
export class AdaptiveQuality {
    private frameTimes: number[] = [];
    private readonly sampleSize = 120; // 2 seconds of samples
    private readonly targetFrameTime = 50; // ~20fps threshold (more lenient)
    private consecutiveBadSamples = 0;

    addFrameTime(ms: number) {
        this.frameTimes.push(ms);
        if (this.frameTimes.length > this.sampleSize) {
            this.frameTimes.shift();
        }
    }

    shouldDownscale(): boolean {
        if (this.frameTimes.length < this.sampleSize) return false;

        const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        if (avg > this.targetFrameTime) {
            this.consecutiveBadSamples++;
        } else {
            this.consecutiveBadSamples = 0;
        }
        // Only downscale after 3 consecutive bad checks (~6 seconds of poor performance)
        return this.consecutiveBadSamples >= 3;
    }

    getAverageFrameTime(): number {
        if (this.frameTimes.length === 0) return 0;
        return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }

    reset() {
        this.frameTimes = [];
        this.consecutiveBadSamples = 0;
    }
}
