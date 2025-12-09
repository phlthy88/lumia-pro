import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { useRenderContext } from './RenderController';
import { eventBus } from '../providers/EventBus';
import { MuiRecorderSettings } from '../components/MuiRecorderSettings';
import { Box, Typography } from '@mui/material';

// Countdown Overlay
const CountdownOverlay: React.FC<{ count: number; type: 'video' | 'photo' }> = ({ count, type }) => {
    const audioCtxRef = React.useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = count === 1 ? 880 : 440;
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


interface RecordingContextState {
  isRecording: boolean;
  isCountingDown: boolean;
  isPhotoCountingDown: boolean;
  isBursting: boolean;
  countdown: number;
  photoCountdown: number;
  recordingTime: number;
  config: any;
  setConfig: any;
  audioConfig: any;
  setAudioConfig: any;
  startRecording: () => void;
  stopRecording: (cb?: (url: string) => void) => void;
  takeScreenshot: () => void;
  takeBurst: (cb: (url: string) => void) => void;
  cancelCountdown: () => void;
  mediaItems: any[];
  loadItemUrl: any;
  deleteMedia: any;
  clearMedia: any;
  audioStream: MediaStream | null;
  error: Error | null | any; // Any to handle FallbackMode from useRecorder if needed, but useRecorder returns string/Error?
}

const RecordingContext = createContext<RecordingContextState | null>(null);

export const useRecordingContext = () => {
  const context = useContext(RecordingContext);
  if (!context) throw new Error('useRecordingContext must be used within RecordingController');
  return context;
};

interface RecordingControllerProps {
  children?: ReactNode;
}

export const RecordingController: React.FC<RecordingControllerProps> = ({ children }) => {
  const { canvasRef, triggerCaptureAnim, triggerSwooshAnim } = useRenderContext();

  const {
      isRecording, isCountingDown, isPhotoCountingDown, isBursting, countdown, photoCountdown, recordingTime, config, setConfig,
      audioConfig, setAudioConfig,
      startRecording, stopRecording, takeScreenshot, takeBurst, cancelCountdown, mediaItems, loadItemUrl, deleteMedia, clearMedia, audioStream, error
  } = useRecorder(canvasRef as React.RefObject<HTMLCanvasElement>);

  // Listen to EventBus triggers
  useEffect(() => {
    const cleanup1 = eventBus.on('recording:toggle' as any, () => {
        if (isRecording) {
            stopRecording((thumbUrl) => {
                triggerCaptureAnim(thumbUrl);
                triggerSwooshAnim(thumbUrl);
            });
        } else {
            startRecording();
        }
    });

    const cleanup2 = eventBus.on('recording:snapshot' as any, () => {
        takeBurst((url) => {
            triggerCaptureAnim(url);
            triggerSwooshAnim(url);
        });
    });

    return () => {
        cleanup1();
        cleanup2();
    };
  }, [isRecording, startRecording, stopRecording, takeBurst, triggerCaptureAnim, triggerSwooshAnim]);

  // Emit status
  useEffect(() => {
    if (isRecording) eventBus.emit('recording:start', undefined);
  }, [isRecording]);

  return (
    <RecordingContext.Provider value={{
      isRecording, isCountingDown, isPhotoCountingDown, isBursting, countdown, photoCountdown, recordingTime, config, setConfig,
      audioConfig, setAudioConfig,
      startRecording, stopRecording, takeScreenshot, takeBurst, cancelCountdown, mediaItems, loadItemUrl, deleteMedia, clearMedia, audioStream, error
    }}>
      {children}
      {(isCountingDown || isPhotoCountingDown) && (
          <CountdownOverlay
              count={isCountingDown ? countdown : photoCountdown}
              type={isCountingDown ? 'video' : 'photo'}
          />
      )}
    </RecordingContext.Provider>
  );
};

export const RecordingSettings: React.FC = () => {
    const { config, setConfig, audioConfig, setAudioConfig, audioStream } = useRecordingContext();
    return (
        <MuiRecorderSettings
            config={config}
            setConfig={setConfig}
            audioConfig={audioConfig}
            setAudioConfig={setAudioConfig}
            audioStream={audioStream}
        />
    );
};
