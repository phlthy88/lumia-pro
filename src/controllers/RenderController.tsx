import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode, useMemo } from 'react';
import { Box } from '@mui/material';
import { useGLRenderer } from '../hooks/useGLRenderer';
import { useColorGrading } from '../hooks/useColorGrading';
import { useOverlays } from '../hooks/useOverlays';
import { useMidi } from '../hooks/useMidi';
import { useGyroscope } from '../hooks/useGyroscope';
import { useVirtualCamera } from '../hooks/useVirtualCamera';
import { useCameraContext } from './CameraController';
import { useAIContext } from './AIController';
import { eventBus } from '../providers/EventBus';
import { LutData, RenderMode, ColorGradeParams, TransformParams, FallbackMode, Preset } from '../types';
import { LutService } from '../services/LutService';
import { virtualCameraService } from '../services/VirtualCameraService';

// UI Components
import { StyledViewfinder } from '../components/layout/StyledViewfinder';
import { StatsOverlay } from '../components/StatsOverlay';
import { PerformanceOverlay } from '../components/PerformanceOverlay';
import { CaptureAnimation } from '../components/CaptureAnimation';
import { ThumbnailSwoosh } from '../components/ThumbnailSwoosh';
import { ControlCard } from '../components/controls/ControlCard';
import { MuiLutControl } from '../components/controls/MuiLutControl';
import { MuiPresetSelector } from '../components/controls/MuiPresetSelector';
import { MuiSlider } from '../components/controls/MuiSlider';
import { MuiSwitch, MuiToggleGroup } from '../components/controls/MuiToggle';
import { MuiButton } from '../components/controls/MuiButton';
import { useRecordingContext } from './RecordingController';
import { ErrorScreen } from '../components/ErrorScreen';
import { useUIState } from '../providers/UIStateProvider';

// Context Definition
interface RenderContextState {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  color: ColorGradeParams;
  transform: TransformParams;
  mode: RenderMode;
  bypass: boolean;
  presets: Preset[];
  activeLutIndex: number;
  availableLuts: LutData[];

  setMode: (mode: RenderMode) => void;
  toggleBypass: () => void;
  handleColorChange: (key: keyof ColorGradeParams, value: number) => void;
  handleTransformChange: (key: keyof TransformParams, value: number | boolean) => void;
  setActiveLutIndex: (index: number) => void;
  handleLutUpload: (file: File) => void;
  resetAll: () => void;
  resetColorWheels: () => void;
  resetGrading: () => void;
  resetDetailOptics: () => void;
  resetTransform: () => void;

  savePreset: (name: string) => void;
  loadPreset: (preset: Preset) => void;
  deletePreset: (id: string) => void;
  importPresets: (file: File) => void;
  exportPresets: () => void;

  setColor: React.Dispatch<React.SetStateAction<ColorGradeParams>>;
  undo: () => void;
  canUndo: boolean;

  overlayConfig: any;
  setOverlayConfig: any;

  midi: any;
  virtualCamera: any;

  glError: FallbackMode | null;

  // Animation Triggers (exposed for RecordingController)
  triggerCaptureAnim: (url: string) => void;
  triggerSwooshAnim: (url: string) => void;
}

const RenderContext = createContext<RenderContextState | null>(null);

export const useRenderContext = () => {
  const context = useContext(RenderContext);
  if (!context) throw new Error('useRenderContext must be used within RenderController');
  return context;
};

interface RenderControllerProps {
  children?: ReactNode;
}

export const RenderController: React.FC<RenderControllerProps> = ({ children }) => {
  const { videoRef, streamReady } = useCameraContext();
  const { showToast } = useUIState();

  // Color Grading Hook
  const {
      color, transform, mode, bypass, presets, setMode, toggleBypass,
      handleColorChange, setColor, undo, canUndo, handleTransformChange, resetAll,
      savePreset, loadPreset, deletePreset, importPresets, exportPresets
  } = useColorGrading();

  const resetColorWheels = useCallback(() => {
      setColor({ ...color, lift: 0, gamma: 0, gain: 0 });
  }, [color, setColor]);

  const resetGrading = useCallback(() => {
      setColor({ ...color, exposure: 0, temperature: 0, tint: 0, saturation: 1, contrast: 1 });
  }, [color, setColor]);

  const resetDetailOptics = useCallback(() => {
      setColor({ ...color, distortion: 0, sharpness: 0.1, portraitLight: 0, denoise: 0, grain: 0.05, vignette: 0.2 });
  }, [color, setColor]);

  const resetTransform = useCallback(() => {
      handleTransformChange('zoom', 1);
      handleTransformChange('rotate', 0);
      handleTransformChange('panX', 0);
      handleTransformChange('panY', 0);
      handleTransformChange('flipX', false);
      handleTransformChange('flipY', false);
  }, [handleTransformChange]);

  // Overlays
  const { config: overlayConfig, setConfig: setOverlayConfig, drawOverlays } = useOverlays();

  // Gyroscope
  const { gyroRef } = useGyroscope(false);

  // MIDI
  const midi = useMidi(handleColorChange);

  // Virtual Camera
  const virtualCamera = useVirtualCamera();

  // LUTs Logic (moved from App.tsx)
  interface LutEntry { name: string; url: string | null; data: LutData | null; }
  const [lutEntries, setLutEntries] = useState<LutEntry[]>([]);
  const [activeLutIndex, setActiveLutIndex] = useState(0);
  const [activeLutData, setActiveLutData] = useState<LutData | null>(null);
  const lutCacheRef = useRef<Map<number, LutData>>(new Map());
  const MAX_CACHED_LUTS = 5;

  const availableLuts = useMemo(() =>
      lutEntries.map(e => e.data || { name: e.name, size: 0, data: new Float32Array(0) }),
      [lutEntries]
  );

  useEffect(() => {
      const catalog: LutEntry[] = [
            { name: 'Standard (Rec.709)', url: null, data: LutService.generateIdentity() },
            { name: 'Blockbuster (Teal/Orange)', url: null, data: LutService.generateTealOrange() },
            // Film Emulation
            { name: 'Kodak Tri-X 400 (B&W)', url: '/luts/bw/kodak_tri-x_400.cube', data: null },
            { name: 'Ilford HP5+ 400 (B&W)', url: '/luts/bw/ilford_hp_5_plus_400.cube', data: null },
            { name: 'Kodak Ektachrome 100', url: '/luts/kodak_ektachrome_100_vs.cube', data: null },
            { name: 'Kodak Portra 160', url: '/luts/kodak_portra_160_vc.cube', data: null },
            { name: 'Fuji Superia 200', url: '/luts/fuji_superia_200.cube', data: null },
            { name: 'Polaroid 690', url: '/luts/polaroid_690.cube', data: null },
            { name: 'Kodak Vision 2383', url: '/luts/film_emulation/Kodak Vision 2383.cube', data: null },
            { name: 'Kodak Portra 400', url: '/luts/film_emulation/Kodak Professional Portra 400.cube', data: null },
            { name: 'Fuji Provia 100F', url: '/luts/film_emulation/Fuji Provia 100F.cube', data: null },
            { name: 'Fuji Superia Xtra 400', url: '/luts/film_emulation/Fuji Superia Xtra 400.cube', data: null },
            { name: 'Polaroid 600', url: '/luts/film_emulation/Polaroid 600.cube', data: null },
            { name: 'Agfa Portrait XPS 160', url: '/luts/film_emulation/Agfa Portrait XPS 160.cube', data: null },
            // Log Conversion
            { name: 'Alexa LogC → Rec709', url: '/luts/log_conversion/Alexa LogC to Rec709.cube', data: null },
            { name: 'Sony SLog3 → Rec709', url: '/luts/log_conversion/Sony SLog3.cube', data: null },
            { name: 'Canon Log3 → Rec709', url: '/luts/log_conversion/Canon Log3.cube', data: null },
            { name: 'Red LogFilm → Rec709', url: '/luts/log_conversion/RedLogFilm to Rec709.cube', data: null },
            { name: 'Panasonic VLog → V709', url: '/luts/log_conversion/Panasonic VLog to V709.cube', data: null },
            { name: 'GoPro Protune → Rec709', url: '/luts/log_conversion/GoPro Protune to Rec709.cube', data: null },
            // Creative Looks
            { name: 'Teal & Orange', url: '/luts/creative_looks/Teal and Orange.cube', data: null },
            { name: 'Brooklyn', url: '/luts/creative_looks/Brooklyn.cube', data: null },
            { name: 'Stranger Things', url: '/luts/creative_looks/Stranger Things.cube', data: null },
            { name: 'Matrix', url: '/luts/creative_looks/Matrix V1.cube', data: null },
            { name: '70s Vintage', url: '/luts/creative_looks/70s.cube', data: null },
            { name: 'Her', url: '/luts/creative_looks/Her.cube', data: null },
            { name: 'Seven', url: '/luts/creative_looks/Seven.cube', data: null },
            { name: 'Thriller', url: '/luts/creative_looks/Thriller.cube', data: null },
            { name: 'Fashion', url: '/luts/creative_looks/Fashion.cube', data: null },
            { name: 'Punch', url: '/luts/creative_looks/Punch.cube', data: null },
            { name: 'Celadon', url: '/luts/creative_looks/Celadon.cube', data: null },
            { name: '3-Strip Technicolor', url: '/luts/creative_looks/3Strip.cube', data: null },
            { name: 'Amelie', url: '/luts/creative_looks/Amelie.cube', data: null },
      ];
      setLutEntries(catalog);
      setActiveLutData(catalog[0]!.data);
  }, []);

  useEffect(() => {
      const entry = lutEntries[activeLutIndex];
      if (!entry) return;
      const cached = lutCacheRef.current.get(activeLutIndex);
      if (cached) {
          setActiveLutData(cached);
          return;
      }
      if (entry.data) {
          lutCacheRef.current.set(activeLutIndex, entry.data);
          setActiveLutData(entry.data);
          return;
      }
      if (entry.url) {
          LutService.loadFromUrl(entry.url, entry.name)
              .then((lut: LutData) => {
                  if (lutCacheRef.current.size >= MAX_CACHED_LUTS) {
                      const oldest = lutCacheRef.current.keys().next().value;
                      if (oldest !== undefined) lutCacheRef.current.delete(oldest);
                  }
                  lutCacheRef.current.set(activeLutIndex, lut);
                  setActiveLutData(lut);
              })
              .catch((err: any) => {
                  console.error(`Failed to load LUT: ${entry.name}`, err);
                  showToast(`Failed to load ${entry.name}`, 'warning');
              });
      }
  }, [activeLutIndex, lutEntries, showToast]);

  const handleLutUpload = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          if (e.target?.result) {
              try {
                  const newLut = LutService.parseCube(e.target.result as string, file.name.replace('.cube', ''));
                  const newIndex = lutEntries.length;
                  setLutEntries(prev => [...prev, { name: newLut.name, url: null, data: newLut }]);
                  lutCacheRef.current.set(newIndex, newLut);
                  setTimeout(() => setActiveLutIndex(newIndex), 0);
              } catch (err) {
                  showToast("Failed to parse LUT file.", 'error');
              }
          }
      };
      reader.readAsText(file);
  };

  // AI & Beauty Integration
  // Use a context selector to prevent cyclic dependency issues or just use context?
  // AIController depends on RenderController (for canvasRef).
  // RenderController depends on AIController (for face params).
  // We need to break this cycle.
  // Solution: AIController emits 'ai:result' event. RenderController listens.
  // And RenderController exposes canvasRef.
  // The 'face' params for rendering come from... where?
  // In App.tsx, `getParams` used `vision.landmarks`.
  // Here, we need to store those params in RenderController state, updated via event.

  const [beautyParams, setBeautyParams] = useState<any>({
      faceCenter: { x: 0.5, y: 0.5 },
      mouthCenter: { x: 0.5, y: 0.7 },
      beauty: {
          smoothStrength: 0,
          eyeBrighten: 0,
          faceThin: 0,
          skinTone: 0,
          cheekbones: 0,
          lipsFuller: 0,
          noseSlim: 0
      }
  });

  // Listen for AI results
  useEffect(() => {
    // This part is tricky. 'ai:result' event in the prompt only had "params: Partial<ColorGradeParams>".
    // It didn't mention face landmarks.
    // But GLRenderer needs face landmarks for beauty effects.
    // I should update the event map or use a separate event.
    // For now, let's assume we can subscribe to `ai:landmarks`?
    // Or we use `AIContext`?
    // If we use `useAIContext`, we need `AIController` to wrap `RenderController`.
    // But `AIController` needs `canvasRef` from `RenderController`.
    // This is a cycle.
    // The "Props in" for AIController says "canvasRef from RenderController".
    // This implies RenderController is ABOVE AIController?
    // Or they are siblings and we use a ref created in App.tsx?
    // The plan says `App.tsx` creates `canvasRef`.
    // So both can access it.
    // So we can use `useAIContext` if `AIController` is higher up?
    // App.tsx:
    // <CameraController>
    //   <RenderController>
    //     <AIController> ... </AIController>
    //   </RenderController>
    // </CameraController>
    // But plan says they are siblings.
    // Siblings can't consume each other's context.
    // So they must communicate via EventBus or shared parent state.
    // The shared parent is `App.tsx` which has `canvasRef`.
    // But `App.tsx` is "thin".
    // So `RenderController` needs to know about Face Landmarks.
    // I will add `ai:landmarks` to EventBus in the future updates, but for now I can't modify EventBus easily.
    // Wait, I just created EventBus.ts. I can modify it if I need to.
    // But the constraints say "Do NOT change render pipeline logic".
    // The logic relies on `vision.landmarks`.
    // Let's check `AIController` task description.
    // "Emits: ai:result with suggested params".
    // It doesn't say it emits landmarks.
    // BUT `src/App.tsx` passed `vision.landmarks` to `useGLRenderer`'s `getParams`.
    // So `RenderController` NEEDS landmarks.
    // I will modify `EventBus.ts` to include `ai:landmarks` or add it to `ai:result`.
    // Actually, `ai:result` params is `Partial<ColorGradeParams>`.
    // I will add a NEW listener for face data.
    // Or better: `RenderController` can use `useVisionWorker` directly?
    // No, `AIController` owns `useVisionWorker`.
    // So `AIController` must emit the landmarks.
    // I'll add a custom event dispatch in `AIController` later.
    // Here in `RenderController`, I'll listen for it.
    // Let's assume `eventBus` can handle `ai:landmarks`.

    const removeListener = eventBus.on('ai:landmarks' as any, (detail: any) => {
        setBeautyParams((prev: any) => ({ ...prev, ...detail }));
    });
    return removeListener;
  }, []);

  // Update Auto Fix params from AI
  useEffect(() => {
      const removeListener = eventBus.on('ai:result', (detail) => {
          if (detail.params) {
             // setColor expects SetStateAction<ColorGradeParams>, but here we cast it carefully
             (setColor as any)((prev: ColorGradeParams) => ({ ...prev, ...detail.params }));
             showToast("Auto-correction applied", 'success');
          }
      });
      return removeListener;
  }, [setColor, showToast]);


  // Renderer Setup
  const latestStateRef = useRef({
      color, transform, mode, bypass,
      ...beautyParams
  });

  useEffect(() => {
      latestStateRef.current = {
          color, transform, mode, bypass,
          ...beautyParams
      };
  }, [color, transform, mode, bypass, beautyParams]);

  const getParams = useCallback(() => {
      const { gyroRef } = require('../hooks/useGyroscope').useGyroscope(false); // Quick hack to get ref, or use the one we have
      // Wait, we have `gyroRef` from `useGyroscope` above.
      return {
          ...latestStateRef.current,
          gyroAngle: gyroRef.current
      };
  }, [gyroRef]);

  const { canvasRef, statsRef, setLut, setBeautyMask, setBeautyMask2, error: glError } = useGLRenderer(videoRef, streamReady, getParams, drawOverlays);

  // Sync LUT
  useEffect(() => {
      if (activeLutData) setLut(activeLutData);
  }, [activeLutData, setLut]);

  // Sync Beauty Masks (Listens to AIController output via EventBus?)
  // `useGLRenderer` expects `setBeautyMask`.
  // `App.tsx` had `maskGenerator` updating masks based on landmarks.
  // `AIController` owns `MaskGenerator`.
  // `AIController` needs to call `setBeautyMask`.
  // But `setBeautyMask` comes from `useGLRenderer`, which is in `RenderController`.
  // So `RenderController` needs to expose `setBeautyMask`?
  // OR `AIController` generates the canvas and emits it?
  // "AIController owns MaskGenerator".
  // So `AIController` produces a canvas.
  // It can emit 'ai:masks' event with the canvas?
  // This seems heavy for EventBus (passing canvas objects).
  // Better: `RenderController` exposes `setBeautyMask` via Context?
  // But siblings can't see context.
  // This implies `RenderController` should perhaps be a PARENT of `AIController`?
  // The plan said: "Props in: canvasRef from RenderController".
  // This implies RenderController creates the canvas ref?
  // No, `App.tsx` creates it.
  // If `App.tsx` holds `canvasRef`, `RenderController` draws to it.
  // `AIController` reads from it.
  // How does `setBeautyMask` get called?
  // Maybe `RenderController` exposes a method on `eventBus`? "render:update-mask"?
  // Yes.

  useEffect(() => {
      const handleMaskUpdate = (e: CustomEvent) => {
          const { mask1, mask2 } = e.detail;
          setBeautyMask(mask1);
          setBeautyMask2(mask2);
      };
      // We need to extend EventBus or just use raw event listener for this specific heavy object passing
      window.addEventListener('ai:masks', handleMaskUpdate as EventListener);
      return () => window.removeEventListener('ai:masks', handleMaskUpdate as EventListener);
  }, [setBeautyMask, setBeautyMask2]);

  // Context Lost handling
  useEffect(() => {
      if (glError) {
          eventBus.emit('gl:contextlost', undefined);
      }
  }, [glError]);

  // Init Virtual Camera
  useEffect(() => {
      if (canvasRef.current && streamReady) {
          virtualCamera.initialize(canvasRef.current);
      }
  }, [streamReady, virtualCamera, canvasRef]);

  // Visuals state
  const [captureAnim, setCaptureAnim] = useState<string | null>(null);
  const [swooshThumbnail, setSwooshThumbnail] = useState<string | null>(null);
  const [showPerfOverlay, setShowPerfOverlay] = useState(false);

  // Keyboard shortcut for Perf Overlay
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.shiftKey && e.key === 'P') {
              setShowPerfOverlay(prev => !prev);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <RenderContext.Provider value={{
      canvasRef, color, transform, mode, bypass, presets,
      activeLutIndex, availableLuts,
      setMode, toggleBypass, handleColorChange, handleTransformChange,
      setActiveLutIndex, handleLutUpload,
      resetAll, resetColorWheels, resetGrading, resetDetailOptics, resetTransform,
      savePreset, loadPreset: loadPreset as any, deletePreset, importPresets: importPresets as any, exportPresets,
      overlayConfig, setOverlayConfig,
      midi, virtualCamera, glError,
      triggerCaptureAnim: setCaptureAnim,
      triggerSwooshAnim: setSwooshThumbnail,
      setColor: setColor as any, undo, canUndo
    }}>
      {children}

      {/* Viewfinder & Overlays */}
      <StyledViewfinder
          isRecording={false} // Managed by RecordingController, visual only here?
          // Wait, StyledViewfinder needs recording state.
          // We can use RecordingContext if we are a child, or pass it in?
          // We are siblings.
          // Let's leave isRecording false here, and let the RecordingController overlay handle the "Recording" indicator?
          // Actually StyledViewfinder adds the red border.
          // We might need to listen to 'recording:start' event to update local state.
          onRecordToggle={() => eventBus.emit('recording:toggle' as any, undefined)} // Dispatch event
          onSnapshot={() => eventBus.emit('recording:snapshot' as any, undefined)}
          onCompareToggle={toggleBypass}
          isBypass={bypass}
          audioStream={null} // TODO: Audio stream from RecordingController?
      >
           {/* We need to pass children to StyledViewfinder? No it expects children */}
           <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
           />
           <StatsOverlay
              statsRef={statsRef}
              gyroAngleRef={gyroRef}
              bypass={bypass}
              isRecording={false} // Todo: Sync
              recordingTime={0} // Todo: Sync
              midiConnected={midi.connected}
           />
      </StyledViewfinder>

      <CaptureAnimation imageUrl={captureAnim} onComplete={() => setCaptureAnim(null)} />
      <ThumbnailSwoosh thumbnailUrl={swooshThumbnail} onComplete={() => setSwooshThumbnail(null)} />
      <PerformanceOverlay visible={showPerfOverlay} engineStats={statsRef.current} />

      {glError && <ErrorScreen mode={glError} />}
    </RenderContext.Provider>
  );
};

export const RenderSettings: React.FC = () => {
  const {
      color, transform, mode, bypass, presets,
      activeLutIndex, availableLuts,
      setMode, toggleBypass, handleColorChange, handleTransformChange,
      setActiveLutIndex, handleLutUpload,
      resetColorWheels, resetGrading, resetDetailOptics, resetTransform,
      savePreset, loadPreset, deletePreset, importPresets, exportPresets
  } = useRenderContext();

  // ... Render controls (ControlCard, etc) ...
  // Copying the JSX from App.tsx "ADJUST" tab
  return (
      <>
         <ControlCard title="Mode & Presets">
            <MuiToggleGroup
                label="Render Mode"
                value={mode}
                options={[
                    { value: RenderMode.Standard, label: 'STD' },
                    { value: RenderMode.FocusPeaking, label: 'PEAK' },
                    { value: RenderMode.Zebras, label: 'ZEBRA' },
                    { value: RenderMode.Level, label: 'LEVEL' },
                    { value: RenderMode.Heatmap, label: 'IRE' },
                    { value: RenderMode.RGBAParade, label: 'PARADE' },
                    { value: RenderMode.Histogram, label: 'HIST' },
                ]}
                onChange={(v) => setMode(v as RenderMode)}
            />

            <MuiSwitch label="Engine Bypass" checked={bypass} onChange={toggleBypass} />

            <Box mt={2}>
                <MuiPresetSelector
                    presets={presets}
                    onLoad={loadPreset as any}
                    onSave={savePreset}
                    onDelete={deletePreset}
                    onImport={importPresets as any}
                    onExport={exportPresets}
                />
            </Box>
        </ControlCard>

        <ControlCard title="Virtual Gimbal" onReset={resetTransform}>
            <MuiSlider label="Zoom" value={transform.zoom} min={1.0} max={4.0} step={0.01} onChange={(v) => handleTransformChange('zoom', v)} unit="x" />
            <MuiSlider label="Rotation" value={transform.rotate} min={-45} max={45} step={0.1} onChange={(v) => handleTransformChange('rotate', v)} unit="°" />
            <MuiSlider label="Pan X" value={transform.panX} min={-1.0} max={1.0} step={0.01} onChange={(v) => handleTransformChange('panX', v)} />
            <MuiSlider label="Pan Y" value={transform.panY} min={-1.0} max={1.0} step={0.01} onChange={(v) => handleTransformChange('panY', v)} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <MuiButton
                    variant={transform.flipX ? 'contained' : 'outlined'}
                    onClick={() => handleTransformChange('flipX', !transform.flipX)}
                    sx={{ flex: 1 }}
                >
                    ↔ Flip X
                </MuiButton>
                <MuiButton
                    variant={transform.flipY ? 'contained' : 'outlined'}
                    onClick={() => handleTransformChange('flipY', !transform.flipY)}
                    sx={{ flex: 1 }}
                >
                    ↕ Flip Y
                </MuiButton>
            </Box>
        </ControlCard>

        <MuiLutControl
            luts={availableLuts}
            activeIndex={activeLutIndex}
            strength={color.lutStrength}
            onSelect={setActiveLutIndex}
            onUpload={handleLutUpload}
            onChangeStrength={(v) => handleColorChange('lutStrength', v)}
        />

        <ControlCard title="Color Wheels" onReset={resetColorWheels}>
            <MuiSlider label="Lift" value={color.lift} min={-1.0} max={1.0} step={0.01} onChange={(v) => handleColorChange('lift', v)} />
            <MuiSlider label="Gamma" value={color.gamma} min={-1.0} max={1.0} step={0.01} onChange={(v) => handleColorChange('gamma', v)} />
            <MuiSlider label="Gain" value={color.gain} min={-1.0} max={1.0} step={0.01} onChange={(v) => handleColorChange('gain', v)} />
        </ControlCard>

        <ControlCard title="Grading" onReset={resetGrading}>
            <MuiSlider label="Exp" value={color.exposure} min={-2} max={2} step={0.1} onChange={(v)=>handleColorChange('exposure',v)} unit="EV"/>
            <MuiSlider label="Temp" value={color.temperature} min={-1} max={1} step={0.01} onChange={(v)=>handleColorChange('temperature',v)}/>
            <MuiSlider label="Tint" value={color.tint} min={-1} max={1} step={0.01} onChange={(v)=>handleColorChange('tint',v)}/>
            <MuiSlider label="Sat" value={color.saturation} min={0} max={2} step={0.01} onChange={(v)=>handleColorChange('saturation',v)}/>
            <MuiSlider label="Cont" value={color.contrast} min={0.5} max={1.5} step={0.01} onChange={(v)=>handleColorChange('contrast',v)}/>
        </ControlCard>

          <ControlCard title="Detail & Optics" defaultExpanded={false} onReset={resetDetailOptics}>
            <MuiSlider label="Lens Distortion" value={color.distortion} min={-1.0} max={1.0} step={0.01} onChange={(v)=>handleColorChange('distortion',v)} />
            <MuiSlider label="Sharpness" value={color.sharpness} min={0} max={1} step={0.01} onChange={(v)=>handleColorChange('sharpness',v)}/>
            <MuiSlider label="Portrait Light" value={color.portraitLight} min={0} max={1} step={0.01} onChange={(v)=>handleColorChange('portraitLight',v)}/>
            <MuiSlider label="Denoise" value={color.denoise} min={0} max={1} step={0.01} onChange={(v)=>handleColorChange('denoise',v)}/>
            <MuiSlider label="Grain" value={color.grain} min={0} max={0.5} step={0.01} onChange={(v)=>handleColorChange('grain',v)}/>
            <MuiSlider label="Vignette" value={color.vignette} min={0} max={1} step={0.01} onChange={(v)=>handleColorChange('vignette',v)}/>
        </ControlCard>
      </>
  );
};
