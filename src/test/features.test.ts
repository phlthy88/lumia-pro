import { describe, it, expect } from 'vitest';
import { isFeatureEnabled, Features } from '../config/features';

describe('Feature Flags', () => {
    it('returns true for AI_SCENE_ANALYSIS by default', () => {
        expect(isFeatureEnabled(Features.AI_SCENE_ANALYSIS)).toBe(true);
    });

    it('returns true for BEAUTY_EFFECTS by default', () => {
        expect(isFeatureEnabled(Features.BEAUTY_EFFECTS)).toBe(true);
    });
});
