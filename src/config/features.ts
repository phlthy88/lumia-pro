import { getEnv } from './env';

export const Features = {
    AI_SCENE_ANALYSIS: 'AI_SCENE_ANALYSIS',
    BEAUTY_EFFECTS: 'BEAUTY_EFFECTS'
} as const;

export type Feature = typeof Features[keyof typeof Features];

const defaultFeatures: Record<Feature, boolean> = {
    [Features.AI_SCENE_ANALYSIS]: false,
    [Features.BEAUTY_EFFECTS]: true
};

export const isFeatureEnabled = (feature: Feature): boolean => {
    switch (feature) {
        case Features.AI_SCENE_ANALYSIS: {
            // Require an API key to unlock AI-powered analysis
            const apiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY');
            return Boolean(apiKey && apiKey.trim().length > 0);
        }
        default:
            return defaultFeatures[feature] ?? false;
    }
};
