import { describe, it, expect, vi } from 'vitest';
import { isFeatureEnabled, Features } from '../config/features';
import * as envModule from '../config/env';

describe('Feature Flags', () => {
    it('returns false for AI_SCENE_ANALYSIS when API key is missing', () => {
        const spy = vi.spyOn(envModule, 'getEnv').mockReturnValue(undefined);
        expect(isFeatureEnabled(Features.AI_SCENE_ANALYSIS)).toBe(false);
        spy.mockRestore();
    });

    it('returns true for AI_SCENE_ANALYSIS when API key is present', () => {
        const spy = vi.spyOn(envModule, 'getEnv').mockReturnValue('api-key');
        expect(isFeatureEnabled(Features.AI_SCENE_ANALYSIS)).toBe(true);
        spy.mockRestore();
    });

    it('returns true for BEAUTY_EFFECTS by default', () => {
        expect(isFeatureEnabled(Features.BEAUTY_EFFECTS)).toBe(true);
    });
});
