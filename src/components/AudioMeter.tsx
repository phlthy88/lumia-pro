import React, { useEffect, useRef, useState } from 'react';
import { Box, useTheme, keyframes } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
`;

interface AudioMeterProps {
  audioStream?: MediaStream | null;
  variant?: 'horizontal' | 'vertical' | 'circular';
  showIcon?: boolean;
}

export const AudioMeter: React.FC<AudioMeterProps> = ({ 
  audioStream, 
  variant = 'horizontal',
  showIcon = true 
}) => {
  const theme = useTheme();
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!audioStream) {
      setLevel(0);
      setPeak(0);
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalized = Math.min(100, (average / 255) * 100);
      
      setLevel(normalized);
      setPeak(prev => Math.max(prev * 0.95, normalized));
      
      animationRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [audioStream]);

  const isActive = level > 5;
  const intensity = Math.min(1, level / 100);

  if (variant === 'circular') {
    return (
      <Box
        sx={{
          position: 'relative',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${theme.palette.primary.main}`,
            opacity: 0.3,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(${theme.palette.primary.main} ${level * 3.6}deg, transparent ${level * 3.6}deg)`,
            animation: isActive ? `${pulse} 1s ease-in-out infinite` : 'none',
            transition: 'all 0.1s ease-out',
          }}
        />
        {showIcon && (
          <MicIcon 
            sx={{ 
              color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              fontSize: 24,
              zIndex: 1,
              transition: 'color 0.2s ease',
            }} 
          />
        )}
      </Box>
    );
  }

  if (variant === 'vertical') {
    return (
      <Box
        sx={{
          width: 32,
          height: 120,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${level}%`,
            background: `linear-gradient(to top, 
              ${theme.palette.primary.main}, 
              ${theme.palette.secondary.main})`,
            transition: 'height 0.1s ease-out',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, transparent, ${theme.palette.primary.light}, transparent)`,
              backgroundSize: '200% 100%',
              animation: isActive ? `${shimmer} 2s linear infinite` : 'none',
            },
          }}
        />
        {peak > 10 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: `${peak}%`,
              left: 0,
              right: 0,
              height: 2,
              bgcolor: theme.palette.error.main,
              transition: 'bottom 0.05s ease-out',
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 200,
      }}
    >
      {showIcon && (
        <MicIcon 
          sx={{ 
            color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
            fontSize: 20,
            animation: isActive ? `${pulse} 1s ease-in-out infinite` : 'none',
            transition: 'color 0.2s ease',
          }} 
        />
      )}
      <Box
        sx={{
          flex: 1,
          height: 24,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${level}%`,
            background: `linear-gradient(to right, 
              ${theme.palette.primary.main}, 
              ${theme.palette.secondary.main})`,
            borderRadius: 3,
            transition: 'width 0.1s ease-out',
            boxShadow: isActive ? `0 0 12px ${theme.palette.primary.main}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}` : 'none',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, transparent, ${theme.palette.primary.light}, transparent)`,
              backgroundSize: '200% 100%',
              animation: isActive ? `${shimmer} 2s linear infinite` : 'none',
            },
          }}
        />
        {peak > 10 && (
          <Box
            sx={{
              position: 'absolute',
              left: `${peak}%`,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: theme.palette.error.main,
              transition: 'left 0.05s ease-out',
            }}
          />
        )}
      </Box>
    </Box>
  );
};
