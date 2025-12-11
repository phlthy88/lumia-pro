import React from 'react';
import { Box, Paper, Fab, Stack, Button, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FiberManualRecord, CameraAlt, CompareArrows } from '@mui/icons-material';
import { AudioMeter } from '../AudioMeter';

const recordingPulse = keyframes`
  0%, 100% { 
    opacity: 0.3;
    transform: scale(1);
  }
  50% { 
    opacity: 0.5;
    transform: scale(1.05);
  }
`;

const recordButtonPulse = keyframes`
  0%, 100% { 
    boxShadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  50% { 
    boxShadow: 0 0 0 8px rgba(244, 67, 54, 0);
  }
`;

const recordIconGlow = keyframes`
  0%, 100% { 
    filter: drop-shadow(0 0 4px rgba(244, 67, 54, 0.8));
  }
  50% { 
    filter: drop-shadow(0 0 8px rgba(244, 67, 54, 1));
  }
`;

const ViewfinderContainer = styled(Paper)({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  maxHeight: '100%',
  borderRadius: '24px',
  overflow: 'hidden',
  backgroundColor: '#000',
  border: '3px solid rgba(255,255,255,0.15)',
  boxShadow: `
    0 24px 48px -12px rgba(0, 0, 0, 0.8), 
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    inset 0 2px 0 rgba(255,255,255,0.1),
    inset 0 -2px 0 rgba(0,0,0,0.3)
  `,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // Enable container queries
  containerType: 'size',
});

const ScreenBezel = styled(Box)({
  position: 'absolute',
  inset: 0,
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.05)',
  pointerEvents: 'none',
  zIndex: 50,
  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
});

// Responsive controls wrapper using container queries
const ControlsStack = styled(Stack)({
  position: 'absolute',
  bottom: '3cqmin',
  right: '3cqmin',
  alignItems: 'center',
  zIndex: 60,
  gap: '1.5cqmin',
  // Scale based on container, max at default size
  '--scale': 'min(1, 2.5cqmin / 10px)',
});

interface Props {
  children: React.ReactNode;
  isRecording?: boolean;
  onRecordToggle?: () => void;
  onSnapshot?: () => void;
  onCompareToggle?: () => void;
  isBypass?: boolean;
  audioStream?: MediaStream | null;
}

export const StyledViewfinder: React.FC<Props> = ({ 
  children, 
  isRecording, 
  onRecordToggle, 
  onSnapshot, 
  onCompareToggle, 
  isBypass,
  audioStream
}) => (
  <Box sx={{ 
    position: 'relative', 
    width: '100%', 
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    isolation: 'isolate',
  }}>
    {/* Recording glow behind viewfinder */}
    <Box
      sx={{
        position: 'absolute',
        inset: -12,
        borderRadius: '36px',
        opacity: isRecording ? 1 : 0,
        background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)',
        filter: 'blur(20px)',
        animation: isRecording ? `${recordingPulse} 2s ease-in-out infinite` : undefined,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
    <ViewfinderContainer elevation={12}>
      {children}
      
      {/* Action Buttons - Bottom right, scales with container */}
      <ControlsStack direction="column">
        {onCompareToggle && (
          <Button
            variant="contained"
            size="small"
            color={isBypass ? 'warning' : 'primary'}
            onClick={onCompareToggle}
            sx={{ 
              borderRadius: '1.5cqmin',
              px: '2cqmin',
              py: '0.8cqmin',
              minWidth: 'max(60px, 15cqmin)',
              maxWidth: '120px',
              height: 'min(32px, 5cqmin)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 'clamp(8px, 2cqmin, 13px)',
              '& .MuiButton-startIcon': {
                marginRight: '0.5cqmin',
                '& > svg': {
                  fontSize: 'clamp(10px, 2.5cqmin, 18px)',
                }
              }
            }}
            startIcon={<CompareArrows />}
            aria-label={isBypass ? "Show processed view" : "Show original view"}
          >
            {isBypass ? "Original" : "Processed"}
          </Button>
        )}

        {onSnapshot && (
          <Fab 
            size="small"
            onClick={onSnapshot}
            sx={{
              bgcolor: 'white',
              color: 'black',
              width: 'clamp(28px, 7cqmin, 48px)',
              height: 'clamp(28px, 7cqmin, 48px)',
              minHeight: 'unset',
              minWidth: 'unset',
              '&:hover': { bgcolor: '#e0e0e0' },
              '& svg': {
                fontSize: 'clamp(14px, 3.5cqmin, 22px)',
              }
            }}
            aria-label="Take screenshot"
          >
            <CameraAlt />
          </Fab>
        )}

        {onRecordToggle && (
          <Fab 
            color={isRecording ? 'error' : 'primary'}
            onClick={onRecordToggle}
            sx={{
              width: 'clamp(36px, 10cqmin, 72px)',
              height: 'clamp(36px, 10cqmin, 72px)',
              minHeight: 'unset',
              minWidth: 'unset',
              animation: isRecording ? `${recordButtonPulse} 2s ease-in-out infinite` : 'none',
              '& svg': {
                fontSize: 'clamp(16px, 4.5cqmin, 32px)',
                animation: isRecording ? `${recordIconGlow} 1.5s ease-in-out infinite` : 'none',
              }
            }}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <FiberManualRecord />
          </Fab>
        )}
      </ControlsStack>

      {/* Audio Meter - positioned relative to controls */}
      {isRecording && audioStream && (
        <Box sx={{ 
          position: 'absolute', 
          right: '3cqmin', 
          bottom: 'calc(3cqmin + clamp(36px, 10cqmin, 72px) + clamp(28px, 7cqmin, 48px) + 5cqmin)',
          transform: 'scale(clamp(0.6, 0.1cqmin, 1))',
          transformOrigin: 'bottom right',
        }}>
          <AudioMeter audioStream={audioStream} variant="circular" showIcon={false} />
        </Box>
      )}

      <ScreenBezel />
    </ViewfinderContainer>
  </Box>
);
