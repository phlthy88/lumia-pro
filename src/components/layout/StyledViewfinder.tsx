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
      
      {/* Action Buttons - Bottom right */}
      <Stack 
        direction="column" 
        spacing={1} 
        sx={{
          position: 'absolute',
          bottom: { xs: 70, sm: 24 },
          right: { xs: 8, sm: 24 },
          alignItems: 'center',
          zIndex: 60
        }}
      >
        {onCompareToggle && (
          <Button
            variant="contained"
            size="small"
            color={isBypass ? 'warning' : 'primary'}
            onClick={onCompareToggle}
            sx={{ 
              borderRadius: 6,
              px: { xs: 1, sm: 1.5 },
              width: { xs: 90, sm: 120 },
              minWidth: 'auto',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.6rem', sm: '0.8rem' }
            }}
            startIcon={<CompareArrows sx={{ fontSize: { xs: 14, sm: 20 } }} />}
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
              width: { xs: 32, sm: 48 },
              height: { xs: 32, sm: 48 },
              minHeight: 'auto',
              '&:hover': { bgcolor: '#e0e0e0' }
            }}
            aria-label="Take screenshot"
          >
            <CameraAlt sx={{ fontSize: { xs: 16, sm: 22 } }} />
          </Fab>
        )}

        {onRecordToggle && (
          <Fab 
            color={isRecording ? 'error' : 'primary'}
            onClick={onRecordToggle}
            sx={{
              width: { xs: 44, sm: 72 },
              height: { xs: 44, sm: 72 },
              minHeight: 'auto',
            }}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <FiberManualRecord sx={{ 
              fontSize: { xs: 20, sm: 32 },
            }} />
          </Fab>
        )}

        {isRecording && audioStream && (
          <Box sx={{ position: 'absolute', right: 16, bottom: 16 }}>
            <AudioMeter audioStream={audioStream} variant="circular" showIcon={false} />
          </Box>
        )}
      </Stack>

      <ScreenBezel />
    </ViewfinderContainer>
  </Box>
);
