import { useState, useCallback, useRef, useEffect } from 'react';
import { ColorGradeParams } from '../types';

interface AIAnalysisResult {
  score: {
    exposure: number;
    contrast: number;
    saturation: number;
    temperature: number;
  };
  tips: string[];
  autoParams: Partial<ColorGradeParams>;
  faces: number;
}

interface AIState {
  isAnalyzing: boolean;
  result: AIAnalysisResult | null;
  error: string | null;
  lastAnalysis: number;
}

export const useAI = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [state, setState] = useState<AIState>({
    isAnalyzing: false,
    result: null,
    error: null,
    lastAnalysis: 0
  });

  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeFrame = useCallback(async (): Promise<AIAnalysisResult | null> => {
    if (!videoRef.current) return null;

    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Convert to ImageData for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple AI analysis simulation
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i] ?? 0;
      totalG += data[i + 1] ?? 0;
      totalB += data[i + 2] ?? 0;
      pixelCount++;
    }

    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    const avgLuma = (avgR * 0.299 + avgG * 0.587 + avgB * 0.114) / 255;

    // Generate analysis result
    const result: AIAnalysisResult = {
      score: {
        exposure: avgLuma > 0.7 ? 0.3 : avgLuma < 0.3 ? 0.8 : 0.9,
        contrast: Math.random() * 0.5 + 0.5,
        saturation: Math.random() * 0.3 + 0.7,
        temperature: Math.random() * 0.4 + 0.6
      },
      tips: [
        avgLuma > 0.7 ? 'Image appears overexposed' : 
        avgLuma < 0.3 ? 'Image appears underexposed' : 'Exposure looks good',
        'Consider adjusting contrast for more depth'
      ],
      autoParams: {
        exposure: avgLuma > 0.7 ? -0.3 : avgLuma < 0.3 ? 0.3 : 0,
        contrast: avgLuma < 0.5 ? 1.2 : 1.0,
        saturation: 1.1,
        temperature: avgB > avgR ? 0.1 : -0.1
      },
      faces: Math.floor(Math.random() * 3) // Simulate face detection
    };

    return result;
  }, [videoRef]);

  const runAnalysis = useCallback(async () => {
    const now = Date.now();
    
    // Rate limiting: minimum 2 seconds between analyses
    if (now - state.lastAnalysis < 2000) {
      return;
    }

    // Cancel previous analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      error: null,
      lastAnalysis: now 
    }));

    try {
      // Debounce: wait 500ms before actual analysis
      await new Promise(resolve => {
        analysisTimeoutRef.current = setTimeout(resolve, 500);
      });

      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      const result = await analyzeFrame();
      
      if (!abortControllerRef.current.signal.aborted) {
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          result,
          error: null
        }));
      }
    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: 'Analysis failed'
        }));
      }
    }
  }, [analyzeFrame, state.lastAnalysis]);

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, result: null, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isAnalyzing: state.isAnalyzing,
    result: state.result,
    error: state.error,
    runAnalysis,
    clearResult
  };
};
