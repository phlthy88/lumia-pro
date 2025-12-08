
export class AdaptiveQuality {
    private frameTimes: number[] = [];
    private readonly sampleSize = 60;
    private readonly targetFrameTime = 33.33; // ~30fps

    addFrameTime(ms: number) {
        this.frameTimes.push(ms);
        if (this.frameTimes.length > this.sampleSize) {
            this.frameTimes.shift();
        }
    }

    shouldDownscale(): boolean {
        if (this.frameTimes.length < this.sampleSize) return false;

        const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        return avg > this.targetFrameTime;
    }

    getAverageFrameTime(): number {
        if (this.frameTimes.length === 0) return 0;
        return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }

    reset() {
        this.frameTimes = [];
    }
}
