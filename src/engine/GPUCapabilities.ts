
export type GPUTier = 'high' | 'mid' | 'low';

export interface QualityProfile {
    resolutionScale: number; // 1.0 = full, 0.75 = downscaled
    lutSize: number; // 64 or 32
    precision: 'highp' | 'mediump' | 'lowp';
    maxLights: number;
    shadows: boolean;
}

export class GPUCapabilities {
    static getTier(): GPUTier {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        if (!gl) return 'low';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return 'low';

        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();

        // Simple heuristic for detection
        if (renderer.includes('nvidia') || renderer.includes('radeon') || renderer.includes('apple m')) {
            return 'high';
        }
        if (renderer.includes('intel iris') || renderer.includes('adreno 6')) {
            return 'mid';
        }
        return 'low';
    }

    static getProfile(tier: GPUTier): QualityProfile {
        switch (tier) {
            case 'high':
                return {
                    resolutionScale: 1.0,
                    lutSize: 64,
                    precision: 'highp',
                    maxLights: 4,
                    shadows: true
                };
            case 'mid':
                return {
                    resolutionScale: 0.85,
                    lutSize: 32,
                    precision: 'mediump',
                    maxLights: 2,
                    shadows: false
                };
            case 'low':
            default:
                return {
                    resolutionScale: 0.5, // Aggressive downscale for low-end
                    lutSize: 16,
                    precision: 'lowp',
                    maxLights: 0,
                    shadows: false
                };
        }
    }
}
