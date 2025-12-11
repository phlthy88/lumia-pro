import { describe, it, expect } from 'vitest';
import { Features, isFeatureEnabled } from '../features';

describe('Features', () => {
  it('defines AI_SCENE_ANALYSIS feature', () => {
    expect(Features.AI_SCENE_ANALYSIS).toBe('AI_SCENE_ANALYSIS');
  });

  it('defines BEAUTY_EFFECTS feature', () => {
    expect(Features.BEAUTY_EFFECTS).toBe('BEAUTY_EFFECTS');
  });

  it('defines WEBRTC_VIRTUAL_CAM feature', () => {
    expect(Features.WEBRTC_VIRTUAL_CAM).toBe('WEBRTC_VIRTUAL_CAM');
  });

  it('defines GEMINI_AI feature', () => {
    expect(Features.GEMINI_AI).toBe('GEMINI_AI');
  });
});

describe('isFeatureEnabled', () => {
  it('returns true for AI_SCENE_ANALYSIS', () => {
    expect(isFeatureEnabled(Features.AI_SCENE_ANALYSIS)).toBe(true);
  });

  it('returns true for BEAUTY_EFFECTS', () => {
    expect(isFeatureEnabled(Features.BEAUTY_EFFECTS)).toBe(true);
  });

  it('returns false for WEBRTC_VIRTUAL_CAM (experimental)', () => {
    expect(isFeatureEnabled(Features.WEBRTC_VIRTUAL_CAM)).toBe(false);
  });

  it('returns false for GEMINI_AI (disabled)', () => {
    expect(isFeatureEnabled(Features.GEMINI_AI)).toBe(false);
  });

  it('returns false for unknown feature', () => {
    expect(isFeatureEnabled('UNKNOWN_FEATURE' as any)).toBe(false);
  });
});
