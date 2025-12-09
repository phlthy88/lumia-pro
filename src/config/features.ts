import { getEnv } from './env';

export const Features = {
  AI_SCENE_ANALYSIS: 'AI_SCENE_ANALYSIS',
  BEAUTY_EFFECTS: 'BEAUTY_EFFECTS',
  WEBRTC_VIRTUAL_CAM: 'WEBRTC_VIRTUAL_CAM',
  GEMINI_AI: 'GEMINI_AI',
} as const;

export type Feature = typeof Features[keyof typeof Features];

const defaultFeatures: Record<Feature, boolean> = {
  [Features.AI_SCENE_ANALYSIS]: true,
  [Features.BEAUTY_EFFECTS]: true,
  [Features.WEBRTC_VIRTUAL_CAM]: false, // Experimental - not yet implemented
  [Features.GEMINI_AI]: false, // Disabled - using heuristic analysis instead
};

export const isFeatureEnabled = (feature: Feature): boolean => {
  return defaultFeatures[feature] ?? false;
};
