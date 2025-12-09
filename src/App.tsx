import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Snackbar, Alert } from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';
import { ThemeProvider, useAppTheme } from './theme/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { RenderMode, LutData, BeautyConfig, FallbackMode, AudioConfig } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorScreen } from './components/ErrorScreen';

// Hooks
import { useCameraStream } from './hooks/useCameraStream';
import { useColorGrading } from './hooks/useColorGrading';
import { useHardwareControls } from './hooks/useHardwareControls';
import { useGyroscope } from './hooks/useGyroscope';
import { useGLRenderer } from './hooks/useGLRenderer';
import { useRecorder } from './hooks/useRecorder';
import { useOverlays } from './hooks/useOverlays';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useVirtualCamera } from './hooks/useVirtualCamera';
import { useMidi } from './hooks/useMidi';
import { LutService } from './services/LutService';
import { useAIAnalysis } from './hooks/useAIAnalysis';
import { useVisionWorker } from './hooks/useVisionWorker';
import { MaskGenerator } from './beauty/MaskGenerator';

// Services
import { aiService } from './services/AIAnalysisService';
import { virtualCameraService } from './services/VirtualCameraService';
import { useMemoryMonitor } from './hooks/useMemoryMonitor';
import { migrateSettings } from './services/SettingsMigration';

// Components
import { FeatureGate } from './components/FeatureGate';
import { Features } from './config/features';
import { MuiLutControl } from './components/controls/MuiLutControl';
import { MuiPresetSelector } from './components/controls/MuiPresetSelector';
import { MuiSlider } from './components/controls/MuiSlider';
import { MuiSwitch, MuiToggleGroup } from './components/controls/MuiToggle';
import { MuiSelect } from './components/controls/MuiSelect';
import { MuiButton } from './components/controls/MuiButton';
import { ControlCard } from './components/controls/ControlCard';
import { StatsOverlay } from './components/StatsOverlay';
import { StyledViewfinder } from './components/layout/StyledViewfinder';
import { CaptureAnimation } from './components/CaptureAnimation';
import { ThumbnailSwoosh } from './components/ThumbnailSwoosh';
import { PerformanceOverlay } from './components/PerformanceOverlay';

// Lazy Load Heavy Components
const MediaLibrary = React.lazy(() => import('./components/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const ThemeSettings = React.lazy(() => import('./components/ThemeSettings').then(m => ({ default: m.ThemeSettings })));
const MuiOverlaySettings = React.lazy(() => import('./components/MuiOverlaySettings').then(m => ({ default: m.MuiOverlaySettings })));
const MuiRecorderSettings = React.lazy(() => import('./components/MuiRecorderSettings').then(m => ({ default: m.MuiRecorderSettings })));
const VirtualCameraSettings = React.lazy(() => import('./components/VirtualCameraSettings').then(m => ({ default: m.VirtualCameraSettings })));
const PlatformBoostsPanel = React.lazy(() => import('./components/PlatformBoostsPanel').then(m => ({ default: m.PlatformBoostsPanel })));
const ParallaxHeader = React.lazy(() => import('./components/ParallaxHeader').then(m => ({ default: m.ParallaxHeader })));
const AISettings = React.lazy(() => import('./components/AISettings').then(m => ({ default: m.AISettings })));

// Countdown Overlay with audio cues
const CountdownOverlay: React.FC<{ count: number; type: 'video' | 'photo' }> = ({ count, type }) => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    
    useEffect(() => {
        // Play beep sound
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = count === 1 ? 880 : 440; // Higher pitch on final count
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.stop(ctx.currentTime + 0.15);
        
        return () => { osc.disconnect(); gain.disconnect(); };
    }, [count]);

    return (
        <Box 
            sx={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                bgcolor: 'rgba(0,0,0,0.6)', 
                backdropFilter: 'blur(8px)', 
                zIndex: 9999 
            }}
        >
            <Typography 
                variant="h1" 
                sx={{ 
                    fontSize: '12rem', 
                    fontWeight: 900, 
                    color: 'white',
                    textShadow: '0 0 40px rgba(255,255,255,0.5)',
                    animation: 'pulse 1s ease-in-out',
                    '@keyframes pulse': {
                        '0%': { transform: 'scale(0.8)', opacity: 0 },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)', opacity: 1 },
                    }
                }}
            >
                {count}
            </Typography>
            <Typography variant="h6" color="grey.400" sx={{ mt: 2 }}>
                {type === 'video' ? '🎬 Recording starts...' : '📸 Capturing...'}
            </Typography>
        </Box>
    );
};

const AppContent: React.FC = () => {
    // Memory Monitor
    useMemoryMonitor();

    // Cleanup on unload
    useEffect(() => {
        const handleUnload = () => {
             // Dispose critical services
             // Note: virtualCameraService is imported in hooks usually, but here we need to access the singleton.
             // We can import the singleton directly from the service file.
             // Wait, I imported 'aiService' at the top, but I did NOT import 'virtualCameraService' at the top.
             // I need to import it.
             virtualCameraService.dispose();
             aiService.dispose();
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    // Layout State
    const [activeTab, setActiveTab] = useState('ADJUST');
    const [drawerScrollY, setDrawerScrollY] = useState(0);
    
    // Network Status
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [networkToast, setNetworkToast] = useState<{open: boolean, message: string, severity: 'warning' | 'success'}>({open: false, message: '', severity: 'warning'});
    
    // Offline Banner Logic
    const OfflineBanner = () => (
        isOffline ? (
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'warning.main',
                    color: 'warning.contrastText',
                    textAlign: 'center',
                    py: 0.5,
                    zIndex: 9999,
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}
            >
                Offline Mode - AI features unavailable
            </Box>
        ) : null
    );

    // Capture Animation
    const [captureAnim, setCaptureAnim] = useState<string | null>(null);
    
    // Thumbnail Swoosh Animation
    const [swooshThumbnail, setSwooshThumbnail] = useState<string | null>(null);

    // Performance overlay (toggle with Shift+P)
    const [showPerfOverlay, setShowPerfOverlay] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            setNetworkToast({open: true, message: 'You are offline. Some features may be unavailable.', severity: 'warning'});
        };
        const handleOnline = () => {
            setIsOffline(false);
            setNetworkToast({open: true, message: 'Connection restored.', severity: 'success'});
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shift+P toggles performance overlay
            if (e.shiftKey && e.key === 'P') {
                setShowPerfOverlay(prev => !prev);
            }
        };
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    
    // Core Systems
    const { config: overlayConfig, setConfig: setOverlayConfig, drawOverlays } = useOverlays();
    // Disable state updates for gyro to prevent re-renders
    const { gyroRef } = useGyroscope(false);
    
    const { 
        color, transform, mode, bypass, presets, setMode, toggleBypass,
        handleColorChange, setColor, undo, canUndo, handleTransformChange, resetAll,
        savePreset, loadPreset, deletePreset, importPresets, exportPresets
    } = useColorGrading();

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

    // Reset functions for each section
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

    const resetBeauty = useCallback(() => {
        setBeauty({ enabled: false, smooth: 0.35, eyeBrighten: 0, faceThin: 0, skinTone: 0, cheekbones: 0, lipsFuller: 0, noseSlim: 0 });
    }, []);

    // MIDI Control Integration
    const midi = useMidi(handleColorChange);

    // Fix Duplicate useCameraStream Hook Call
    // We call it once here. `capabilities` will be undefined initially, but that's fine.
    // The hook will update availableResolutions when we re-render with valid capabilities.
    const [streamCapabilities, setStreamCapabilities] = useState<{maxFrameRate?: number, maxWidth?: number, maxHeight?: number}>({});

    const {
        videoRef, deviceList, 
        activeDeviceId, setActiveDeviceId,
        targetRes, targetFps, applyFormat, streamReady, error: cameraError,
        availableResolutions, availableFps
    } = useCameraStream(streamCapabilities.maxFrameRate, streamCapabilities.maxWidth, streamCapabilities.maxHeight);

    // Hardware Controls - pass streamReady for proper timing
    const {
        capabilities, hardware,
        toggleFocusMode, setFocusDistance,
        toggleExposureMode, setShutterSpeed, setExposureCompensation,
        toggleStabilization, toggleTorch
    } = useHardwareControls(activeDeviceId, streamReady);

    // Update stream capabilities when hardware capabilities change
    useEffect(() => {
        if (capabilities) {
            setStreamCapabilities({
                maxFrameRate: capabilities.maxFrameRate,
                maxWidth: capabilities.maxWidth,
                maxHeight: capabilities.maxHeight
            });
        }
    }, [capabilities]);


    // AI - Load model when beauty enabled OR on AI tab
    const visionEnabled = beauty.enabled || activeTab === 'AI';
    const vision = useVisionWorker(videoRef as React.RefObject<HTMLVideoElement>, streamReady, visionEnabled, {
        minFaceDetectionConfidence: 0.3,
        minFacePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3
    });
    const ai = useAIAnalysis(videoRef as React.RefObject<HTMLVideoElement>, vision.landmarks);
    const handleAutoFix = () => {
        if (ai.autoParams) {
            setColor({ ...color, ...ai.autoParams });
        }
    };

    // Renderer
    // Keep a ref of the latest state to pass to renderer without re-binding
    const latestStateRef = useRef({ 
        color, transform, mode, bypass,
        faceCenter: { x: 0.5, y: 0.5 },
        mouthCenter: { x: 0.5, y: 0.7 },
        beauty: { 
            smoothStrength: beauty.enabled ? beauty.smooth : 0,
            eyeBrighten: beauty.enabled ? beauty.eyeBrighten : 0,
            faceThin: beauty.enabled ? beauty.faceThin : 0,
            skinTone: beauty.enabled ? beauty.skinTone : 0,
            cheekbones: beauty.enabled ? beauty.cheekbones : 0,
            lipsFuller: beauty.enabled ? beauty.lipsFuller : 0,
            noseSlim: beauty.enabled ? beauty.noseSlim : 0
        } 
    });
    useEffect(() => {
        latestStateRef.current = { 
            color, 
            transform, 
            mode, 
            bypass,
            faceCenter: latestStateRef.current.faceCenter, // Persist previous values
            mouthCenter: latestStateRef.current.mouthCenter,
            beauty: { 
                smoothStrength: beauty.enabled ? beauty.smooth : 0,
                eyeBrighten: beauty.enabled ? beauty.eyeBrighten : 0,
                faceThin: beauty.enabled ? beauty.faceThin : 0,
                skinTone: beauty.enabled ? beauty.skinTone : 0,
                cheekbones: beauty.enabled ? beauty.cheekbones : 0,
                lipsFuller: beauty.enabled ? beauty.lipsFuller : 0,
                noseSlim: beauty.enabled ? beauty.noseSlim : 0
            }
        };
    }, [color, transform, mode, bypass, beauty]);

    const getParams = useCallback(() => {
        const face = vision.landmarks?.faceLandmarks?.[0];
        let faceCenter = { x: 0.5, y: 0.5 };
        let mouthCenter = { x: 0.5, y: 0.7 };

        if (face && face[4] && face[13] && face[14]) {
            faceCenter = { x: face[4].x, y: 1.0 - face[4].y };
            const mouthX = (face[13].x + face[14].x) / 2;
            const mouthY = (face[13].y + face[14].y) / 2;
            mouthCenter = { x: mouthX, y: 1.0 - mouthY };
        }

        return {
            ...latestStateRef.current,
            faceCenter,
            mouthCenter,
            gyroAngle: gyroRef.current
        };
    }, [gyroRef, vision.landmarks]);

    const { canvasRef, statsRef, setLut, setBeautyMask, setBeautyMask2, error: glError } = useGLRenderer(videoRef, streamReady, getParams, drawOverlays);

    // Beauty mask generation
    const maskGeneratorRef = useRef<MaskGenerator | null>(null);
    useEffect(() => {
        if (!maskGeneratorRef.current) {
            maskGeneratorRef.current = new MaskGenerator();
        }
        if (!beauty.enabled) {
            setBeautyMask(null);
            setBeautyMask2(null);
            return;
        }
        const face = vision.landmarks?.faceLandmarks?.[0];
        const video = videoRef.current;
        if (!face || !video || video.videoWidth === 0 || video.videoHeight === 0) {
            setBeautyMask(null);
            setBeautyMask2(null);
            return;
        }
        maskGeneratorRef.current?.update(face, video.videoWidth, video.videoHeight);
        setBeautyMask(maskGeneratorRef.current?.getCanvas() ?? null);
        setBeautyMask2(maskGeneratorRef.current?.getCanvas2() ?? null);
    }, [vision.landmarks, beauty.enabled, setBeautyMask, setBeautyMask2, videoRef]);

    // Virtual Camera - for use with Zoom/Meet/Teams etc.
    const virtualCamera = useVirtualCamera();
    
    // Initialize virtual camera when canvas is ready
    useEffect(() => {
        if (canvasRef.current && streamReady) {
            virtualCamera.initialize(canvasRef.current);
        }
    }, [streamReady, virtualCamera]);

    // LUTs - lazy loading to reduce memory
    interface LutEntry { name: string; url: string | null; data: LutData | null; }
    const [lutEntries, setLutEntries] = useState<LutEntry[]>([]);
    const [activeLutIndex, setActiveLutIndex] = useState(0);
    const [activeLutData, setActiveLutData] = useState<LutData | null>(null);
    const lutCacheRef = useRef<Map<number, LutData>>(new Map());
    const MAX_CACHED_LUTS = 5; // Only keep 5 LUTs in memory

    // Available LUTs for UI (just names, not data)
    const availableLuts = useMemo(() => 
        lutEntries.map(e => e.data || { name: e.name, size: 0, data: new Float32Array(0) }),
        [lutEntries]
    );

    // Initial LUT catalog (metadata only, no data loaded)
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
        // Set initial LUT data
        setActiveLutData(catalog[0]!.data);
    }, []);

    // Load LUT on demand when selection changes
    useEffect(() => {
        const entry = lutEntries[activeLutIndex];
        if (!entry) return;

        // Check cache first
        const cached = lutCacheRef.current.get(activeLutIndex);
        if (cached) {
            setActiveLutData(cached);
            return;
        }

        // Already loaded inline (generated LUTs)
        if (entry.data) {
            lutCacheRef.current.set(activeLutIndex, entry.data);
            setActiveLutData(entry.data);
            return;
        }

        // Load from URL
        if (entry.url) {
            LutService.loadFromUrl(entry.url, entry.name)
                .then(lut => {
                    // Evict oldest if cache full
                    if (lutCacheRef.current.size >= MAX_CACHED_LUTS) {
                        const oldest = lutCacheRef.current.keys().next().value;
                        if (oldest !== undefined) lutCacheRef.current.delete(oldest);
                    }
                    lutCacheRef.current.set(activeLutIndex, lut);
                    setActiveLutData(lut);
                })
                .catch(err => {
                    console.error(`Failed to load LUT: ${entry.name}`, err);
                    setNetworkToast({ open: true, message: `Failed to load ${entry.name}`, severity: 'warning' });
                });
        }
    }, [activeLutIndex, lutEntries]);

    useEffect(() => {
        if (activeLutData) {
            setLut(activeLutData);
        }
    }, [activeLutData, setLut]);

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
                    alert("Failed to parse LUT file.");
                }
            }
        };
        reader.readAsText(file);
    };

    // Recorder - Add null check for canvasRef
    const { 
        isRecording, isCountingDown, isPhotoCountingDown, isBursting, countdown, photoCountdown, recordingTime, config: recConfig, setConfig: setRecConfig, 
        audioConfig, setAudioConfig,
        startRecording, stopRecording, takeScreenshot, takeBurst, cancelCountdown, mediaItems, loadItemUrl, deleteMedia, clearMedia, audioStream, error: recordingError
    } = useRecorder(canvasRef as React.RefObject<HTMLCanvasElement>);

    // Wrapped screenshot with animation (uses burst mode if configured)
    const handleSnapshot = useCallback(() => {
        takeBurst((url) => {
            setCaptureAnim(url);
            setSwooshThumbnail(url);
        });
    }, [takeBurst]);

    // Trigger swoosh and capture animation when video recording stops
    const handleStopRecording = useCallback(() => {
        stopRecording((thumbUrl) => {
            setCaptureAnim(thumbUrl);
            setSwooshThumbnail(thumbUrl);
        });
    }, [stopRecording]);

    // Shortcuts
    useKeyboardShortcuts({
        onReset: resetAll,
        onToggleBypass: toggleBypass,
        onFullscreen: () => {
             if (!document.fullscreenElement) document.documentElement.requestFullscreen();
             else document.exitFullscreen();
        },
         onCycleMode: () => {
             const modes = Object.values(RenderMode);
             const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
             setMode(modes[nextIndex] as RenderMode);
         },
         onCycleDevice: () => {
              if (deviceList.length > 1) {
                 const idx = deviceList.findIndex(d => d.deviceId === activeDeviceId);
                 const nextIdx = (idx + 1) % deviceList.length;
                 setActiveDeviceId(deviceList[nextIdx]?.deviceId || '');
             }
         },
         onCancelCountdown: cancelCountdown
    });

    // Gatekeeper Logic (Moved to end to prevent Hook mismatch on re-render)
    if (glError) {
        return <ErrorScreen mode={glError} />;
    }
    if (cameraError) {
        // Critical camera errors
        if (cameraError.mode === FallbackMode.CAMERA_DENIED || cameraError.mode === FallbackMode.CAMERA_NOT_FOUND) {
            return <ErrorScreen mode={cameraError.mode} message={cameraError.message} />;
        }
        // Generic camera errors fallback
        if (cameraError.mode === FallbackMode.GENERIC_ERROR) {
             return <ErrorScreen mode={FallbackMode.GENERIC_ERROR} message={cameraError.message} />;
        }
    }

    // --- Drawer Content Factory ---
    const getDrawerContent = () => {
        switch (activeTab) {
            case 'ADJUST':
                return (
                    <>
                        <ParallaxHeader 
                            title="Adjustments" 
                            subtitle="Color grading & camera controls"
                            scrollY={drawerScrollY}
                        />

                        <ControlCard title="Source & Mode">
                            <MuiSelect 
                                label="Camera Device" 
                                value={activeDeviceId} 
                                options={deviceList.map(d => ({ value: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0,5)}` }))} 
                                onChange={setActiveDeviceId} 
                            />
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                <MuiSelect 
                                    label="Resolution" 
                                    value={`${targetRes.w}x${targetRes.h}`}
                                    options={availableResolutions.map(r => ({ value: `${r.width}x${r.height}`, label: r.label }))}
                                    onChange={(v) => {
                                        const [w, h] = v.split('x').map(Number);
                                        applyFormat(w ?? 1920, h ?? 1080, targetFps);
                                    }}
                                />
                                <MuiSelect 
                                    label="FPS" 
                                    value={targetFps}
                                    options={availableFps.map(f => ({ value: f, label: String(f) }))}
                                    onChange={(v) => applyFormat(targetRes.w, targetRes.h, Number(v))}
                                />
                            </Box>
                            {(capabilities.maxWidth || capabilities.maxFrameRate) && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Device max: {capabilities.maxWidth && capabilities.maxHeight ? `${capabilities.maxWidth}×${capabilities.maxHeight}` : ''}{capabilities.maxWidth && capabilities.maxFrameRate ? ' @ ' : ''}{capabilities.maxFrameRate ? `${capabilities.maxFrameRate}fps` : ''}
                                </Typography>
                            )}

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
                                    onLoad={loadPreset} 
                                    onSave={savePreset} 
                                    onDelete={deletePreset} 
                                    onImport={importPresets} 
                                    onExport={exportPresets} 
                                />
                            </Box>
                        </ControlCard>

                        <ControlCard title="Hardware" defaultExpanded={false}>
                            {capabilities.hasTorch && <MuiSwitch label="Torch / Light" checked={hardware.torch} onChange={() => toggleTorch(!hardware.torch)} />}
                            {capabilities.hasStabilization && <MuiSwitch label="Stabilization" checked={hardware.stabilization} onChange={toggleStabilization} />}
                            
                            {capabilities.hasFocus && (
                                <Box mt={2}>
                                    <MuiToggleGroup label="Focus Mode" value={hardware.focusMode} options={[{value:'continuous',label:'AF'}, {value:'manual',label:'MF'}]} onChange={toggleFocusMode} />
                                    {hardware.focusMode === 'manual' && <MuiSlider label="Focus Distance" value={hardware.focusDistance} min={0} max={1} step={0.01} onChange={setFocusDistance} />}
                                </Box>
                            )}

                             {(capabilities.hasExposure || capabilities.hasExposureCompensation) && (
                                <Box mt={2}>
                                    <MuiToggleGroup label="Exposure Mode" value={hardware.exposureMode} options={[{value:'continuous',label:'AUTO'}, {value:'manual',label:'MAN'}]} onChange={toggleExposureMode} />
                                    {hardware.exposureMode === 'continuous' 
                                        ? <MuiSlider label="Exposure Comp" value={hardware.exposureCompensation} min={capabilities.minExposureCompensation||-2} max={capabilities.maxExposureCompensation||2} step={0.5} onChange={setExposureCompensation} unit="EV"/> 
                                        : <MuiSlider label="Shutter Speed" value={hardware.shutterSpeed} min={30} max={1000} step={10} onChange={setShutterSpeed} formatValue={(v)=>`1/${Math.round(v)}s`}/>
                                    }
                                </Box>
                            )}
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
                                    sx={{ 
                                        flex: 1,
                                        transition: 'transform 0.3s ease',
                                        transform: transform.flipX ? 'scaleX(-1)' : 'scaleX(1)'
                                    }}
                                >
                                    ↔ Flip X
                                </MuiButton>
                                <MuiButton 
                                    variant={transform.flipY ? 'contained' : 'outlined'}
                                    onClick={() => handleTransformChange('flipY', !transform.flipY)}
                                    sx={{ 
                                        flex: 1,
                                        transition: 'transform 0.3s ease',
                                        transform: transform.flipY ? 'scaleY(-1)' : 'scaleY(1)'
                                    }}
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
            case 'AI':
                return (
                    <>
                        <ParallaxHeader 
                            title="AI Assistant" 
                            subtitle="Smart analysis & beauty"
                            scrollY={drawerScrollY}
                        />
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
                                result={ai.result}
                                isAnalyzing={ai.isAnalyzing}
                                onAnalyze={ai.runAnalysis}
                                onAutoFix={handleAutoFix}
                                onUndo={undo}
                                canUndo={canUndo}
                                beauty={beauty}
                                setBeauty={setBeauty}
                                hasFace={vision.hasFace}
                                onResetBeauty={resetBeauty}
                            />
                        </FeatureGate>
                    </>
                );
            case 'OVERLAYS':
                return (
                    <>
                        <ParallaxHeader 
                            title="Overlays" 
                            subtitle="Grids, guides & display options"
                            scrollY={drawerScrollY}
                        />
                        <MuiOverlaySettings config={overlayConfig} setConfig={setOverlayConfig} />
                    </>
                );
            case 'BOOSTS':
                return (
                    <>
                        <ParallaxHeader 
                            title="Platform Boosts" 
                            subtitle="Performance optimization"
                            scrollY={drawerScrollY}
                        />
                        <PlatformBoostsPanel />
                    </>
                );
            case 'SYSTEM':
                return (
                    <>
                        <ParallaxHeader 
                            title="System" 
                            subtitle="Recording, export & virtual camera"
                            scrollY={drawerScrollY}
                        />
                        <MuiRecorderSettings config={recConfig} setConfig={setRecConfig} audioConfig={audioConfig} setAudioConfig={setAudioConfig} audioStream={audioStream} />
                        <VirtualCameraSettings virtualCamera={virtualCamera} />
                        <ControlCard title="MIDI Controller">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                {!midi.connected ? (
                                    <MuiButton 
                                        onClick={midi.requestAccess} 
                                        disabled={midi.enabled}
                                        variant="contained"
                                    >
                                        {midi.enabled ? 'Connecting...' : 'Connect MIDI'}
                                    </MuiButton>
                                ) : (
                                    <MuiButton 
                                        onClick={midi.disconnect} 
                                        variant="outlined"
                                        color="error"
                                    >
                                        Disconnect
                                    </MuiButton>
                                )}
                                {midi.connected && (
                                    <Typography variant="caption" color="success.main">● Device active</Typography>
                                )}
                            </Box>
                            {midi.connected && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                        MIDI Activity
                                    </Typography>
                                    <Box sx={{ 
                                        height: 8, 
                                        bgcolor: 'action.hover', 
                                        borderRadius: 1, 
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        <Box sx={{ 
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            height: '100%',
                                            width: `${(midi.lastVelocity / 127) * 100}%`,
                                            bgcolor: midi.lastVelocity > 100 ? 'error.main' : midi.lastVelocity > 64 ? 'warning.main' : 'success.main',
                                            transition: 'width 0.05s ease-out, background-color 0.1s',
                                            borderRadius: 1
                                        }} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                        Velocity: {midi.lastVelocity}
                                    </Typography>
                                </Box>
                            )}
                        </ControlCard>
                    </>
                );
            case 'THEME':
                return (
                    <>
                        <ParallaxHeader 
                            title="Theme" 
                            subtitle="Appearance & color scheme"
                            scrollY={drawerScrollY}
                        />
                        <ThemeSettings />
                    </>
                );
            case 'MEDIA':
                return (
                    <>
                        <ParallaxHeader 
                            title="Media Library" 
                            subtitle={`${mediaItems.length} captured items`}
                            scrollY={drawerScrollY}
                        />
                        {mediaItems.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                                <PhotoLibrary sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                                <Typography variant="h6" gutterBottom>No Media Added</Typography>
                                <Typography variant="body2">Captured photos and videos will appear here</Typography>
                            </Box>
                        ) : (
                            <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
                                <MediaLibrary items={mediaItems} onDelete={deleteMedia} loadItemUrl={loadItemUrl} mode="panel" />
                            </React.Suspense>
                        )}
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <AppLayout 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            drawerContent={getDrawerContent()}
            drawerTitle={activeTab === 'ADJUST' ? 'Adjustments' : activeTab === 'MEDIA' ? 'Media' : activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
            onDrawerScroll={setDrawerScrollY}
        >
             <OfflineBanner />
             {/* Hidden Source Video */}
             <video 
                ref={videoRef} 
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
                playsInline 
                muted 
                autoPlay 
            />
            
            <StyledViewfinder 
                isRecording={isRecording}
                onRecordToggle={isRecording ? handleStopRecording : startRecording}
                onSnapshot={handleSnapshot}
                onCompareToggle={toggleBypass}
                isBypass={bypass}
                audioStream={audioStream}
            >
                <canvas 
                    ref={canvasRef} 
                    style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                />

                {/* Canvas Overlay Stats */}
                <StatsOverlay 
                    statsRef={statsRef} 
                    gyroAngleRef={gyroRef} 
                    bypass={bypass} 
                    isRecording={isRecording} 
                    recordingTime={recordingTime}
                    midiConnected={midi.connected}
                />
            </StyledViewfinder>

            {/* Capture Animation */}
            <CaptureAnimation imageUrl={captureAnim} onComplete={() => setCaptureAnim(null)} />
            
            {/* Thumbnail Swoosh Animation */}
            <ThumbnailSwoosh thumbnailUrl={swooshThumbnail} onComplete={() => setSwooshThumbnail(null)} />

            {/* Performance Overlay (Shift+P to toggle) */}
            <PerformanceOverlay visible={showPerfOverlay} engineStats={statsRef.current} />

            {/* Global Loading Overlay */}
            {!streamReady && (
                <Box 
                    sx={{ 
                        position: 'absolute', 
                        inset: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        bgcolor: 'black',
                        zIndex: 9998,
                        flexDirection: 'column',
                        gap: 2,
                        p: 4
                    }}
                >
                    {cameraError ? (
                         <>
                            <Typography variant="h5" color="error" gutterBottom>Camera Initialization Failed</Typography>
                            <Typography variant="body1" color="white" align="center">{cameraError.message}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>Check permissions and reload.</Typography>
                         </>
                    ) : (
                        <>
                            <CircularProgress color="primary" />
                            <Typography variant="body2" color="text.secondary">Initializing Camera...</Typography>
                        </>
                    )}
                </Box>
            )}

            {(isCountingDown || isPhotoCountingDown) && (
                <CountdownOverlay 
                    count={isCountingDown ? countdown : photoCountdown} 
                    type={isCountingDown ? 'video' : 'photo'} 
                />
            )}

            <Snackbar 
                open={networkToast.open} 
                autoHideDuration={4000} 
                onClose={() => setNetworkToast(prev => ({...prev, open: false}))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={networkToast.severity} variant="filled">{networkToast.message}</Alert>
            </Snackbar>

            {/* Recording Error Toast */}
            {recordingError && (
                <Snackbar
                open={!!recordingError}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert severity="error" variant="filled">
                        Recording Error: Codec not supported or media error.
                    </Alert>
                </Snackbar>
            )}
        </AppLayout>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
