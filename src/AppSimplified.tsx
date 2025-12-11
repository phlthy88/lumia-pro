import React, { useState } from 'react';
import { Box, Button, Slider, Typography } from '@mui/material';
import { useCamera } from './hooks/useCamera';
import { useWebGL } from './hooks/useWebGL';

const AppSimplified: React.FC = () => {
  const camera = useCamera();
  const webgl = useWebGL(camera.stream);
  const [isRecording, setIsRecording] = useState(false);

  const handleStartCamera = async () => {
    try {
      await camera.startCamera();
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  };

  const handleCapturePhoto = () => {
    const dataUrl = webgl.captureFrame();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `lumia-capture-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleColorChange = (param: string, value: number) => {
    webgl.updateColorGrading({ [param]: value });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#000' }}>
      {/* Main Viewport */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Hidden video element */}
        <video
          ref={camera.videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: 'none' }}
        />
        
        {/* WebGL Canvas */}
        <canvas
          ref={webgl.canvasRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />

        {/* Overlay Controls */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 20, 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2
        }}>
          <Button 
            variant="contained" 
            onClick={handleStartCamera}
            disabled={camera.isLoading}
          >
            {camera.stream ? 'Restart Camera' : 'Start Camera'}
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleCapturePhoto}
            disabled={!webgl.isReady}
          >
            Capture
          </Button>
          
          <Button 
            variant="contained" 
            color={isRecording ? 'error' : 'primary'}
            onClick={() => setIsRecording(!isRecording)}
            disabled={!webgl.isReady}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </Box>

        {/* Status Display */}
        <Box sx={{ 
          position: 'absolute', 
          top: 20, 
          right: 20,
          color: 'white',
          bgcolor: 'rgba(0,0,0,0.7)',
          p: 1,
          borderRadius: 1
        }}>
          <Typography variant="caption">
            FPS: {webgl.fps} | Status: {webgl.isReady ? 'Ready' : 'Loading'}
          </Typography>
        </Box>
      </Box>

      {/* Control Panel */}
      <Box sx={{ 
        width: 300, 
        bgcolor: '#1a1a1a', 
        p: 2,
        overflowY: 'auto'
      }}>
        <Typography variant="h6" color="white" gutterBottom>
          Color Grading
        </Typography>

        {/* Exposure */}
        <Box sx={{ mb: 2 }}>
          <Typography color="white" variant="body2">
            Exposure: {webgl.colorParams.exposure.toFixed(2)}
          </Typography>
          <Slider
            value={webgl.colorParams.exposure}
            onChange={(_, value) => handleColorChange('exposure', value as number)}
            min={-2}
            max={2}
            step={0.1}
            sx={{ color: 'white' }}
          />
        </Box>

        {/* Contrast */}
        <Box sx={{ mb: 2 }}>
          <Typography color="white" variant="body2">
            Contrast: {webgl.colorParams.contrast.toFixed(2)}
          </Typography>
          <Slider
            value={webgl.colorParams.contrast}
            onChange={(_, value) => handleColorChange('contrast', value as number)}
            min={0}
            max={2}
            step={0.1}
            sx={{ color: 'white' }}
          />
        </Box>

        {/* Saturation */}
        <Box sx={{ mb: 2 }}>
          <Typography color="white" variant="body2">
            Saturation: {webgl.colorParams.saturation.toFixed(2)}
          </Typography>
          <Slider
            value={webgl.colorParams.saturation}
            onChange={(_, value) => handleColorChange('saturation', value as number)}
            min={0}
            max={2}
            step={0.1}
            sx={{ color: 'white' }}
          />
        </Box>

        {/* Temperature */}
        <Box sx={{ mb: 2 }}>
          <Typography color="white" variant="body2">
            Temperature: {webgl.colorParams.temperature.toFixed(2)}
          </Typography>
          <Slider
            value={webgl.colorParams.temperature}
            onChange={(_, value) => handleColorChange('temperature', value as number)}
            min={-1}
            max={1}
            step={0.1}
            sx={{ color: 'white' }}
          />
        </Box>

        {/* Camera Selection */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" color="white" gutterBottom>
            Camera
          </Typography>
          {camera.devices.map(device => (
            <Button
              key={device.deviceId}
              variant={device.deviceId === camera.currentDeviceId ? 'contained' : 'outlined'}
              onClick={() => camera.switchCamera(device.deviceId)}
              sx={{ display: 'block', mb: 1, width: '100%' }}
            >
              {device.label}
            </Button>
          ))}
        </Box>

        {/* Error Display */}
        {(camera.error || webgl.error) && (
          <Box sx={{ 
            mt: 2, 
            p: 1, 
            bgcolor: 'error.dark', 
            borderRadius: 1 
          }}>
            <Typography color="white" variant="body2">
              {camera.error || webgl.error}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AppSimplified;
