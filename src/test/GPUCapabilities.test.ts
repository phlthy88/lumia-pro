import { describe, it, expect, vi } from 'vitest';
import { GPUCapabilities } from '../engine/GPUCapabilities';

describe('GPUCapabilities', () => {
    it('detects GPU tier based on renderer string', () => {
        // Mock getContext
        const mockGl = {
            getExtension: vi.fn(() => ({ UNMASKED_RENDERER_WEBGL: 1 })),
            getParameter: vi.fn((param) => {
                if (param === 1) return 'NVIDIA GeForce RTX 3080';
                return '';
            })
        };
        const mockCanvas = {
            getContext: vi.fn(() => mockGl)
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        const tier = GPUCapabilities.getTier();
        expect(tier).toBe('high');
    });

    it('falls back to low tier if WebGL not supported', () => {
        const mockCanvas = {
            getContext: vi.fn(() => null)
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        const tier = GPUCapabilities.getTier();
        expect(tier).toBe('low');
    });

    it('returns correct profile for high tier', () => {
        const profile = GPUCapabilities.getProfile('high');
        expect(profile.resolutionScale).toBe(1.0);
        expect(profile.precision).toBe('highp');
    });

    it('returns correct profile for low tier', () => {
        const profile = GPUCapabilities.getProfile('low');
        expect(profile.resolutionScale).toBe(0.5);
        expect(profile.precision).toBe('lowp');
    });
});
