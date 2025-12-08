export const Features = {
    AI_SCENE_ANALYSIS: 'ai_scene_analysis',
    BEAUTY_EFFECTS: 'beauty_effects'
};

export const isFeatureEnabled = (feature: string): boolean => {
    switch (feature) {
        case Features.AI_SCENE_ANALYSIS:
        case Features.BEAUTY_EFFECTS:
            return true;
        default:
            return false;
    }
};
