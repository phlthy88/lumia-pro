import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useCameraContext } from './CameraController';
import { useRenderContext } from './RenderController';
import { useVisionWorker } from '../hooks/useVisionWorker';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { usePerformanceMode } from '../hooks/usePerformanceMode';
import { MaskGenerator } from '../beauty/MaskGenerator';
import { eventBus } from '../providers/EventBus';
import { useUIState } from '../providers/UIStateProvider';
import { Features } from '../config/features';
import { FeatureGate } from '../components/FeatureGate';
import { AISettings } from '../components/AISettings';
import { BeautyConfig } from '../types';
import { Box, Typography } from '@mui/material';
import { sceneDirectorService, SceneAnalysis, APIKeys } from '../services/SceneDirectorService';

interface AIContextState {
  result: any;
  sceneAnalysis: SceneAnalysis | null;
  isAnalyzing: boolean;
  isSceneAnalyzing: boolean;
  visionEnabled: boolean;
  setVisionEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  runAnalysis: () => Promise<void>;
  runSceneAnalysis: () => Promise<void>;
  applySceneAnalysis: () => void;
  beauty: BeautyConfig;
  setBeauty: React.Dispatch<React.SetStateAction<BeautyConfig>>;
  hasFace: boolean;
  handleAutoFix: () => void;
  undo: () => void;
  canUndo: boolean;
  resetBeauty: () => void;
  configureAPIKeys: (keys: APIKeys) => void;
  hasExternalAI: boolean;
}

const AIContext = createContext<AIContextState | null>(null);

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAIContext must be used within AIController');
  return context;
};

interface AIControllerProps {
  children?: ReactNode;
}

export const AIController: React.FC<AIControllerProps> = ({ children }) => {
  const { videoRef, streamReady } = useCameraContext();
  const { activeTab, showToast } = useUIState();
  const { setColor, undo, canUndo } = useRenderContext();

  const [beauty, setBeauty] = useState<BeautyConfig>({
    enabled: false,
    smooth: 0.35,
    eyeBrighten: 0,
    faceThin: 0,
    skinTone: 0,
    cheekbones: 0,
    lipsFuller: 0,
    noseSlim: 0
  });

  const [sceneAnalysis, setSceneAnalysis] = useState<SceneAnalysis | null>(null);
  const [isSceneAnalyzing, setIsSceneAnalyzing] = useState(false);
  const [hasExternalAI, setHasExternalAI] = useState(false);
  const [visionManuallyEnabled, setVisionManuallyEnabled] = useState(true);

  const { settings } = usePerformanceMode();
  
  // Enable vision when performance allows, and user toggles it on
  const visionEnabled = settings.aiEnabled && visionManuallyEnabled && (beauty.enabled || activeTab === 'AI');

  const vision = useVisionWorker(videoRef as React.RefObject<HTMLVideoElement>, streamReady, visionEnabled, {
    minFaceDetectionConfidence: 0.3,
    minFacePresenceConfidence: 0.3,
    minTrackingConfidence: 0.3
  });

  const ai = useAIAnalysis(videoRef as React.RefObject<HTMLVideoElement>, vision.landmarks);

  // Configure API keys
  const configureAPIKeys = useCallback((keys: APIKeys) => {
    sceneDirectorService.configure(keys);
    setHasExternalAI(sceneDirectorService.hasAnyProvider());
  }, []);

  // Run external AI scene analysis
  const runSceneAnalysis = useCallback(async () => {
    if (!videoRef.current || isSceneAnalyzing) return;
    
    setIsSceneAnalyzing(true);
    try {
      const result = await sceneDirectorService.analyze(videoRef.current);
      setSceneAnalysis(result);
      showToast?.(`Scene analyzed by ${result.provider}`, 'success');
    } catch (error) {
      console.error('[AIController] Scene analysis failed:', error);
      showToast?.(error instanceof Error ? error.message : 'Scene analysis failed', 'error');
    } finally {
      setIsSceneAnalyzing(false);
    }
  }, [videoRef, isSceneAnalyzing, showToast]);

  // Apply scene analysis results to color grading
  const applySceneAnalysis = useCallback(() => {
    if (!sceneAnalysis?.suggestedAdjustments) return;

    const adj = sceneAnalysis.suggestedAdjustments;
    setColor(prev => ({
      ...prev,
      exposure: adj.exposure ?? prev.exposure,
      temperature: adj.temperature ?? prev.temperature,
      tint: adj.tint ?? prev.tint,
      contrast: prev.contrast + (adj.contrast ?? 0),
      saturation: prev.saturation + (adj.saturation ?? 0),
    }));

    showToast?.('Applied AI suggestions', 'success');
  }, [sceneAnalysis, setColor, showToast]);

  const handleAutoFix = useCallback(() => {
    if (ai.autoParams) {
      eventBus.emit('ai:result', { params: ai.autoParams });
    }
  }, [ai.autoParams]);

  const resetBeauty = useCallback(() => {
    setBeauty({ enabled: false, smooth: 0.35, eyeBrighten: 0, faceThin: 0, skinTone: 0, cheekbones: 0, lipsFuller: 0, noseSlim: 0 });
  }, []);

  // Mask Generation
  const maskGeneratorRef = useRef<MaskGenerator | null>(null);

  useEffect(() => {
    if (!maskGeneratorRef.current) {
      maskGeneratorRef.current = new MaskGenerator();
    }
    if (!beauty.enabled) {
      eventBus.emit('ai:masks' as any, { mask1: null, mask2: null });
      return;
    }

    const face = vision.landmarks?.faceLandmarks?.[0];
    const video = videoRef.current;

    if (!face || !video || video.videoWidth === 0 || video.videoHeight === 0) {
      eventBus.emit('ai:masks' as any, { mask1: null, mask2: null });
      return;
    }

    maskGeneratorRef.current?.update(face, video.videoWidth, video.videoHeight);
    eventBus.emit('ai:masks' as any, {
      mask1: maskGeneratorRef.current?.getCanvas() ?? null,
      mask2: maskGeneratorRef.current?.getCanvas2() ?? null
    });
  }, [vision.landmarks, beauty.enabled, videoRef]);

  // Emit Landmarks for RenderController
  useEffect(() => {
    if (vision.landmarks?.faceLandmarks?.[0]) {
      const face = vision.landmarks.faceLandmarks[0];
      let faceCenter = { x: 0.5, y: 0.5 };
      let mouthCenter = { x: 0.5, y: 0.7 };

      if (face[4] && face[13] && face[14]) {
        faceCenter = { x: face[4].x, y: 1.0 - face[4].y };
        const mouthX = (face[13].x + face[14].x) / 2;
        const mouthY = (face[13].y + face[14].y) / 2;
        mouthCenter = { x: mouthX, y: 1.0 - mouthY };
      }

      eventBus.emit('ai:landmarks' as any, { faceCenter, mouthCenter });
    }
  }, [vision.landmarks]);

  return (
    <AIContext.Provider value={{
      result: ai.result,
      sceneAnalysis,
      isAnalyzing: ai.isAnalyzing,
      isSceneAnalyzing,
      visionEnabled: visionManuallyEnabled,
      setVisionEnabled: setVisionManuallyEnabled,
      runAnalysis: ai.runAnalysis,
      runSceneAnalysis,
      applySceneAnalysis,
      beauty,
      setBeauty,
      hasFace: vision.hasFace,
      handleAutoFix,
      undo,
      canUndo,
      resetBeauty,
      configureAPIKeys,
      hasExternalAI
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const AISettingsPanel: React.FC = () => {
  const {
    result, sceneAnalysis, isAnalyzing, isSceneAnalyzing,
    runAnalysis, runSceneAnalysis, applySceneAnalysis,
    beauty, setBeauty, hasFace, handleAutoFix,
    undo, canUndo, resetBeauty, configureAPIKeys,
    visionEnabled, setVisionEnabled
  } = useAIContext();

  return (
    <FeatureGate
      feature={Features.AI_SCENE_ANALYSIS}
      fallback={
        <Box p={3} textAlign="center">
          <Typography color="text.secondary">AI features are disabled.</Typography>
        </Box>
      }
    >
      <AISettings
        result={result}
        sceneAnalysis={sceneAnalysis}
        isAnalyzing={isAnalyzing}
        isSceneAnalyzing={isSceneAnalyzing}
        onAnalyze={runAnalysis}
        onSceneAnalyze={runSceneAnalysis}
        onAutoFix={handleAutoFix}
        onApplySceneAnalysis={applySceneAnalysis}
        onUndo={undo}
        canUndo={canUndo}
        beauty={beauty}
        setBeauty={setBeauty}
        hasFace={hasFace}
        onResetBeauty={resetBeauty}
        onAPIKeysChange={configureAPIKeys}
        visionEnabled={visionEnabled}
        onToggleVision={setVisionEnabled}
      />
    </FeatureGate>
  );
};
