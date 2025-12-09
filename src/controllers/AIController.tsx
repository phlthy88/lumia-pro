import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useCameraContext } from './CameraController';
import { useRenderContext } from './RenderController';
import { useVisionWorker } from '../hooks/useVisionWorker';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { MaskGenerator } from '../beauty/MaskGenerator';
import { eventBus } from '../providers/EventBus';
import { Features } from '../config/features';
import { FeatureGate } from '../components/FeatureGate';
import { AISettings } from '../components/AISettings';
import { BeautyConfig, ColorGradeParams } from '../types';
import { Box, Typography } from '@mui/material';
import { FaceLandmarkerResult } from '@mediapipe/tasks-vision';

interface AIContextState {
  result: any;
  isAnalyzing: boolean;
  runAnalysis: () => Promise<void>;
  beauty: BeautyConfig;
  setBeauty: React.Dispatch<React.SetStateAction<BeautyConfig>>;
  hasFace: boolean;
  handleAutoFix: () => void;
  undo: () => void;
  canUndo: boolean;
  resetBeauty: () => void;
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
  // We need canvasRef from RenderController ONLY if AI analysis needs to read from it.
  // Actually, useAIAnalysis reads from video element usually, OR canvas.
  // Let's check src/services/AIAnalysisService.ts
  // It takes (video: HTMLVideoElement).
  // So we don't strictly need canvasRef for analysis.
  // However, MaskGenerator needs video dimensions.

  const {
    color, setColor, undo, canUndo, handleColorChange
  } = useRenderContext();

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

  // Vision Worker
  const visionEnabled = beauty.enabled; // Or if we are in AI tab? We don't know active tab here unless we consume UIState.
  // But hooks shouldn't be conditional on UI state if possible to avoid mounting/unmounting.
  // Although `useVisionWorker` takes `enabled` arg.
  // Let's consume UIState? No, keep it simple. Enable if beauty enabled.
  // Wait, the "AI Tab" logic was: `const visionEnabled = beauty.enabled || activeTab === 'AI';`
  // We can leave it as just `beauty.enabled` for now, or expose a "forceEnable" method?
  // Or just always enable it if beauty is on.
  // If user switches to AI tab but beauty is off, they might want analysis.
  // Let's optimize later.

  const vision = useVisionWorker(videoRef as React.RefObject<HTMLVideoElement>, streamReady, true, { // Always enabled for now to simplify controller logic? Or toggle?
      minFaceDetectionConfidence: 0.3,
      minFacePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3
  });

  // Actually, running vision worker 100% time might be heavy.
  // But `AIController` doesn't know about tabs.
  // Maybe `AIController` exposes `setVisionEnabled`?
  // For now, let's just enable it. It's on a worker.

  const ai = useAIAnalysis(videoRef as React.RefObject<HTMLVideoElement>, vision.landmarks);

  const handleAutoFix = useCallback(() => {
      if (ai.autoParams) {
          // Emit result to RenderController via EventBus
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
          // Emit empty masks
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

      // Emit masks
      eventBus.emit('ai:masks' as any, {
          mask1: maskGeneratorRef.current?.getCanvas() ?? null,
          mask2: maskGeneratorRef.current?.getCanvas2() ?? null
      });

  }, [vision.landmarks, beauty.enabled, videoRef]);

  // Emit Landmarks for RenderController (for face center etc)
  useEffect(() => {
     if (vision.landmarks?.faceLandmarks?.[0]) {
         const face = vision.landmarks.faceLandmarks[0];
         // Calculate centers
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
      isAnalyzing: ai.isAnalyzing,
      runAnalysis: ai.runAnalysis,
      beauty,
      setBeauty,
      hasFace: vision.hasFace,
      handleAutoFix,
      undo,
      canUndo,
      resetBeauty
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const AISettingsPanel: React.FC = () => {
  const {
    result, isAnalyzing, runAnalysis,
    beauty, setBeauty, hasFace, handleAutoFix,
    undo, canUndo, resetBeauty
  } = useAIContext();

  return (
      <FeatureGate
          feature={Features.AI_SCENE_ANALYSIS}
          fallback={
              <Box p={3} textAlign="center">
                  <Typography color="text.secondary">
                      AI features require a Gemini API Key to be configured.
                  </Typography>
              </Box>
          }
      >
          <AISettings
              result={result}
              isAnalyzing={isAnalyzing}
              onAnalyze={runAnalysis}
              onAutoFix={handleAutoFix}
              onUndo={undo}
              canUndo={canUndo}
              beauty={beauty}
              setBeauty={setBeauty}
              hasFace={hasFace}
              onResetBeauty={resetBeauty}
          />
      </FeatureGate>
  );
};
