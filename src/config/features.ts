import { getEnv } from './env';

export const Features = {
    AI_SCENE_ANALYSIS: 'ai_scene_analysis',
    BEAUTY_EFFECTS: 'beauty_effects'
};

export const isFeatureEnabled = (feature: string): boolean => {
    switch (feature) {
        case Features.AI_SCENE_ANALYSIS:
            return !!getEnv('VITE_GEMINI_API_KEY');
        case Features.BEAUTY_EFFECTS:
            // Could add logic here if beauty depends on specific hardware
            return true;
        default:
            return false;
    }
};
