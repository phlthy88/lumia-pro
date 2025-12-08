// import { CameraCapabilities } from '../types'; // Currently unused

export class CameraControlService {
    private stream: MediaStream | null = null;
    private track: MediaStreamTrack | null = null;
    private constraintQueue: Array<{constraints: MediaTrackConstraints, resolve: () => void, reject: (error: any) => void}> = [];
    private isProcessingQueue = false;

    // Mutex-like lock for constraints application with proper queuing
    private async safeApply(constraints: MediaTrackConstraints): Promise<void> {
        return new Promise((resolve, reject) => {
            this.constraintQueue.push({ constraints, resolve, reject });
            this.processConstraintQueue();
        });
    }
    
    private async processConstraintQueue() {
        if (this.isProcessingQueue || this.constraintQueue.length === 0 || !this.track) return;
        
        this.isProcessingQueue = true;
        const { constraints, resolve, reject } = this.constraintQueue.shift()!;
        
        try {
            await this.track.applyConstraints(constraints);
            resolve();
        } catch(e) {
            console.warn("Constraint application failed", e);
            reject(e);
        } finally {
            this.isProcessingQueue = false;
            // Process next item in queue
            setTimeout(() => this.processConstraintQueue(), 0);
        }
    }

    public async initialize(deviceId?: string): Promise<MediaStream> {
        // Stop existing stream
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
        }

        // Request highest resolution the camera supports
        const constraints: MediaStreamConstraints = {
            audio: false,
            video: deviceId 
                ? { deviceId: { exact: deviceId }, width: { ideal: 4096 }, height: { ideal: 2160 } }
                : { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } }
        };

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.track = this.stream.getVideoTracks()[0] || null;
        return this.stream;
    }

    public getCapabilities(): MediaTrackCapabilities | null {
        return this.track ? this.track.getCapabilities() : null;
    }

    public getSettings(): MediaTrackSettings | null {
        return this.track ? this.track.getSettings() : null;
    }

    // --- Format ---
    
    public async setFormat(width: number, height: number, fps: number) {
        await this.safeApply({
            width: { ideal: width },
            height: { ideal: height },
            frameRate: { ideal: fps }
        });
    }

    // --- Hardware Features ---

    public async setTorch(on: boolean) {
        await this.safeApply({ 
            advanced: [{ torch: on } as any]
        });
    }

    public async setFocusMode(mode: 'continuous' | 'manual') {
        await this.safeApply({ focusMode: mode } as any);
    }

    public async setFocusDistance(distance: number) {
        await this.safeApply({ focusMode: 'manual', focusDistance: distance } as any);
    }

    public async setExposureMode(mode: 'continuous' | 'manual') {
        await this.safeApply({ exposureMode: mode } as any);
    }

    public async setExposureCompensation(ev: number) {
        await this.safeApply({ exposureMode: 'continuous', exposureCompensation: ev } as any);
    }

    public async setExposureDuration(shutterSpeedInv: number) {
        // Approximate conversion if necessary, or pass through
        // Note: Chrome uses exposureTime in ticks or similar? 
        // Spec says exposureTime is in seconds usually.
        // If shutterSpeedInv is 60 (for 1/60s), duration is 1/60.
        const duration = shutterSpeedInv > 0 ? 1.0 / shutterSpeedInv : 0;
        await this.safeApply({ exposureMode: 'manual', exposureTime: duration } as any);
    }

    public async setWhiteBalanceMode(mode: 'continuous' | 'manual') {
        await this.safeApply({ whiteBalanceMode: mode } as any);
    }

    public async setColorTemperature(kelvin: number) {
        await this.safeApply({ whiteBalanceMode: 'manual', colorTemperature: kelvin } as any);
    }
}

export const cameraService = new CameraControlService();