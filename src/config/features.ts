import { getEnv } from './env';

export const Features = {
    AI_SCENE_ANALYSIS: 'AI_SCENE_ANALYSIS',
    BEAUTY_EFFECTS: 'BEAUTY_EFFECTS'
} as const;

export type Feature = typeof Features[keyof typeof Features];

const defaultFeatures: Record<Feature, boolean> = {
    [Features.AI_SCENE_ANALYSIS]: true,
    [Features.BEAUTY_EFFECTS]: true
};

export const isFeatureEnabled = (feature: Feature): boolean => {
    return defaultFeatures[feature] ?? false;
};
