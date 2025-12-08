
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
        if (!debugInfo) return 'mid'; // Default to mid if can't detect

        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();

        // High tier: discrete GPUs
        if (renderer.includes('nvidia') || renderer.includes('radeon') || renderer.includes('apple m')) {
            return 'high';
        }
        // Mid tier: modern integrated GPUs
        if (renderer.includes('intel') || renderer.includes('adreno') || renderer.includes('mali')) {
            return 'mid';
        }
        // Low tier: software rendering or unknown
        if (renderer.includes('swiftshader') || renderer.includes('llvmpipe')) {
            return 'low';
        }
        return 'mid'; // Default to mid for unknown GPUs
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
                    resolutionScale: 1.0,
                    lutSize: 32,
                    precision: 'highp',
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
