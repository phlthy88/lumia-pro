
export interface PermissionStatus {
    camera: PermissionState;
    microphone: PermissionState;
    midi: PermissionState;
}

export class PermissionManager {
    static async checkAll(): Promise<PermissionStatus> {
        return {
            camera: await this.check('camera'),
            microphone: await this.check('microphone'),
            midi: await this.check('midi' as any) // Type assertion for MIDI
        };
    }

    static async check(name: PermissionName): Promise<PermissionState> {
        try {
            if (!navigator.permissions || !navigator.permissions.query) {
                return 'prompt'; // Fallback for browsers without permissions API
            }
            const status = await navigator.permissions.query({ name } as any);
            return status.state;
        } catch (e) {
            console.warn(`Permission check failed for ${name}`, e);
            return 'prompt';
        }
    }

    static async requestCamera(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(t => t.stop());
            return true;
        } catch (e) {
            return false;
        }
    }

    static async requestMicrophone(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
            return true;
        } catch (e) {
            return false;
        }
    }

    static async requestMidi(): Promise<boolean> {
        try {
            if (!navigator.requestMIDIAccess) return false;
            await navigator.requestMIDIAccess();
            return true;
        } catch (e) {
            return false;
        }
    }
}
