import React, { useState, useCallback, useRef } from 'react';
import { aiService, AnalysisResult } from '../services/AIAnalysisService';
import { ColorGradeParams } from '../types';

export const useAIAnalysis = (
    videoRef: React.RefObject<HTMLVideoElement>
) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [lastAutoParams, setLastAutoParams] = useState<Partial<ColorGradeParams> | null>(null);

    const runAnalysis = useCallback(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || isAnalyzing) return;
        
        setIsAnalyzing(true);
        setResult(null); // Clear previous result to allow fresh analysis
        try {
            const res = await aiService.analyze(videoRef.current);
            setResult(res);
            setLastAutoParams(res.autoParams);
        } finally {
            setIsAnalyzing(false);
        }
    }, [isAnalyzing]);

    const clearResult = useCallback(() => {
        setResult(null);
    }, []);

    return {
        runAnalysis,
        autoParams: lastAutoParams,
        result,
        isAnalyzing,
        hasFixAvailable: !!lastAutoParams,
        clearResult
    };
};
