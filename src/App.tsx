import React, { Suspense, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';
import { ThemeProvider } from './theme/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CameraErrorBoundary } from './components/CameraErrorBoundary';
import { CompatibilityWarning } from './components/CompatibilityWarning';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { useDeferredInit } from './hooks/useDeferredInit';

// Providers & Controllers
import { UIStateProvider, useUIState } from './providers/UIStateProvider';
import { CameraController, CameraSettings, useCameraContext } from './controllers/CameraController';
import { RenderController, RenderSettings, Viewfinder } from './controllers/RenderController';
import { AIController, AISettingsPanel } from './controllers/AIController';
import { RecordingController, RecordingSettings, useRecordingContext } from './controllers/RecordingController';

// Services
import virtualCameraService from './services/VirtualCameraService';
import { aiService } from './services/AIAnalysisService';
import { useMemoryMonitor } from './hooks/useMemoryMonitor';
import { useRenderContext } from './controllers/RenderController';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { RenderMode } from './types';
import { HistogramMeter } from './components/HistogramMeter';
import { RGBParadeMeter } from './components/RGBParadeMeter';

// Components (Lazy)
const MediaLibrary = React.lazy(() => import('./components/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const ThemeSettings = React.lazy(() => import('./components/ThemeSettings').then(m => ({ default: m.ThemeSettings })));
const MuiOverlaySettings = React.lazy(() => import('./components/MuiOverlaySettings').then(m => ({ default: m.MuiOverlaySettings })));
const VirtualCameraSettings = React.lazy(() => import('./components/VirtualCameraSettings').then(m => ({ default: m.VirtualCameraSettings })));
const PlatformBoostsPanel = React.lazy(() => import('./components/PlatformBoostsPanel').then(m => ({ default: m.PlatformBoostsPanel })));
const Vectorscope = React.lazy(() => import('./components/Vectorscope').then(m => ({ default: m.Vectorscope })));
import { ParallaxHeader } from './components/ParallaxHeader';
import { PerformanceModeToggle } from './components/PerformanceModeToggle';
import { ControlCard } from './components/controls/ControlCard';
import { MuiSwitch } from './components/controls/MuiToggle';
import { MuiSlider } from './components/controls/MuiSlider';

// Separate component for drawer content to consume contexts
const AppDrawerContent: React.FC<{ scrollY: number }> = ({ scrollY }) => {
    const { activeTab } = useUIState();
    const { overlayConfig, setOverlayConfig, midi, virtualCamera, wipePosition, setWipePosition } = useRenderContext();
    const { mediaItems, deleteMedia, loadItemUrl } = useRecordingContext();
    const { videoRef } = useCameraContext();
    const [vectorscopeEnabled, setVectorscopeEnabled] = useState(false);
    const [histogramEnabled, setHistogramEnabled] = useState(false);
    const [paradeEnabled, setParadeEnabled] = useState(false);

    switch (activeTab) {
        case 'ADJUST':
            return (
                <>
                    <ParallaxHeader title="Adjustments" subtitle="Color grading & camera controls" scrollY={scrollY} />
                    <CameraSettings />
                    <RenderSettings />
                </>
            );
        case 'AI':
            return (
                <>
                    <ParallaxHeader title="AI Assistant" subtitle="Smart analysis & beauty" scrollY={scrollY} />
                    <AISettingsPanel />
                </>
            );
        case 'OVERLAYS':
            return (
                <>
                    <ParallaxHeader title="Overlays" subtitle="Grids, guides & display options" scrollY={scrollY} />
                    <Suspense fallback={<CircularProgress />}><MuiOverlaySettings config={overlayConfig} setConfig={setOverlayConfig} /></Suspense>
                    <ControlCard title="A/B Comparison">
                        <MuiSwitch label="Enable Wipe" checked={wipePosition > 0} onChange={(enabled) => setWipePosition(enabled ? 0.5 : 0)} />
                        {wipePosition > 0 && (
                            <MuiSlider label="Wipe Position" value={wipePosition} min={0.01} max={0.99} step={0.01} onChange={setWipePosition} />
                        )}
                    </ControlCard>
                </>
            );
        case 'METERS':
            return (
                <>
                    <ParallaxHeader title="Meters" subtitle="Scopes & analysis tools" scrollY={scrollY} />
                    <ControlCard title="Scopes">
                        <MuiSwitch label="Vectorscope" checked={vectorscopeEnabled} onChange={setVectorscopeEnabled} />
                        {vectorscopeEnabled && (
                            <Suspense fallback={<CircularProgress size={20} />}>
                                <Vectorscope videoRef={videoRef} enabled={vectorscopeEnabled} size={140} />
                            </Suspense>
                        )}
                        <MuiSwitch label="Histogram" checked={histogramEnabled} onChange={setHistogramEnabled} />
                        <MuiSwitch label="RGB Parade" checked={paradeEnabled} onChange={setParadeEnabled} />
                        {(histogramEnabled || paradeEnabled) && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                                {histogramEnabled && (
                                    <Suspense fallback={<CircularProgress size={20} />}>
                                        <HistogramMeter videoRef={videoRef} enabled={histogramEnabled} />
                                    </Suspense>
                                )}
                                {paradeEnabled && (
                                    <Suspense fallback={<CircularProgress size={20} />}>
                                        <RGBParadeMeter videoRef={videoRef} enabled={paradeEnabled} />
                                    </Suspense>
                                )}
                            </Box>
                        )}
                    </ControlCard>
                </>
            );
        case 'BOOSTS':
            return (
                <>
                    <ParallaxHeader title="Platform Boosts" subtitle="Performance optimization" scrollY={scrollY} />
                    <ControlCard title="Quality Mode">
                        <PerformanceModeToggle />
                    </ControlCard>
                    <Suspense fallback={<CircularProgress />}><PlatformBoostsPanel /></Suspense>
                </>
            );
        case 'SYSTEM':
            return (
                <>
                    <ParallaxHeader title="System" subtitle="Recording, export & virtual camera" scrollY={scrollY} />
                    <RecordingSettings />
                    <Suspense fallback={<CircularProgress />}><VirtualCameraSettings virtualCamera={virtualCamera} /></Suspense>
                    {/* MIDI Control Card could be extracted or left here using 'midi' from context */}
                    {/* For brevity, omitting detailed MIDI UI here, assuming RenderSettings handles MIDI or we add it back if critical */}
                </>
            );
        case 'THEME':
            return (
                <>
                    <ParallaxHeader title="Theme" subtitle="Appearance & color scheme" scrollY={scrollY} />
                    <Suspense fallback={<CircularProgress />}><ThemeSettings /></Suspense>
                </>
            );
        case 'MEDIA':
            return (
                <>
                    <ParallaxHeader title="Media Library" subtitle={`${mediaItems.length} captured items`} scrollY={scrollY} />
                    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
                        {mediaItems.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                                <PhotoLibrary sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                                <Typography variant="h6" gutterBottom>No Media Added</Typography>
                            </Box>
                        ) : (
                            <MediaLibrary items={mediaItems} onDelete={deleteMedia} loadItemUrl={loadItemUrl} mode="panel" />
                        )}
                    </Suspense>
                </>
            );
        default:
            return null;
    }
};

const AppContent: React.FC = () => {
    useMemoryMonitor();
    const { activeTab, setActiveTab } = useUIState();
    const [drawerScrollY, setDrawerScrollY] = React.useState(0);

    // Cleanup on unload
    React.useEffect(() => {
        const handleUnload = () => {
             virtualCameraService.dispose();
             aiService.dispose();
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    return (
        <AppLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            drawerContent={<AppDrawerContent scrollY={drawerScrollY} />}
            drawerTitle={activeTab === 'ADJUST' ? 'Adjustments' : activeTab === 'MEDIA' ? 'Media' : activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
            onDrawerScroll={setDrawerScrollY}
        >
             <Viewfinder />
             <ShortcutsListener />
        </AppLayout>
    );
};

// Component to bind shortcuts using contexts
const ShortcutsListener = () => {
    const { resetAll, toggleBypass, setMode, mode } = useRenderContext();
    const { deviceList, activeDeviceId, setActiveDeviceId } = useCameraContext();
    const { cancelCountdown } = useRecordingContext();

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
             setMode(modes[nextIndex] as any);
        },
        onCycleDevice: () => {
              if (deviceList.length > 1) {
                 const idx = deviceList.findIndex((d: any) => d.deviceId === activeDeviceId);
                 const nextIdx = (idx + 1) % deviceList.length;
                 setActiveDeviceId(deviceList[nextIdx]?.deviceId || '');
             }
         },
         onCancelCountdown: cancelCountdown
    });

    return null;
}

import { PerformanceModeProvider } from './providers/PerformanceModeProvider';

export default function App() {
  const ready = useDeferredInit(50); // Defer heavy initialization by 50ms
  
  if (!ready) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
        <ThemeProvider>
            <UIStateProvider>
              <PerformanceModeProvider>
                <CameraController>
                    <CameraErrorBoundary>
                        <RenderController>
                            <AIController>
                                <RecordingController>
                                    <AppContent />
                                    <CompatibilityWarning />
                                    <PerformanceDashboard />
                                </RecordingController>
                            </AIController>
                        </RenderController>
                    </CameraErrorBoundary>
                </CameraController>
              </PerformanceModeProvider>
            </UIStateProvider>
        </ThemeProvider>
    </ErrorBoundary>
  );
}
