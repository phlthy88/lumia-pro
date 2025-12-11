import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, LinearProgress,
  Chip, Alert, IconButton, Collapse, keyframes
} from '@mui/material';
import { Speed, VisibilityOff } from '@mui/icons-material';
import { performanceMonitoringService } from '../services/PerformanceMonitoringService';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const spinReverse = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
`;

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  gpuMemory: number;
  renderTime: number;
  timestamp: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [averages, setAverages] = useState<Partial<PerformanceMetrics>>({});
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [spinAnim, setSpinAnim] = useState<'none' | 'open' | 'close'>('none');

  const handleToggle = () => {
    setSpinAnim(isVisible ? 'close' : 'open');
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    performanceMonitoringService.startMonitoring(1000);
    
    const unsubscribe = performanceMonitoringService.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
      setAverages(performanceMonitoringService.getAverageMetrics());
    });

    const handlePerformanceAlert = (event: CustomEvent) => {
      setAlerts(event.detail.issues);
      setTimeout(() => setAlerts([]), 5000);
    };

    window.addEventListener('performance-alert', handlePerformanceAlert as EventListener);

    return () => {
      unsubscribe();
      performanceMonitoringService.stopMonitoring();
      window.removeEventListener('performance-alert', handlePerformanceAlert as EventListener);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 50) return 'success';
    if (fps >= 30) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 1300 }}>
      <IconButton
        onClick={handleToggle}
        sx={{ 
          bgcolor: isVisible ? 'primary.main' : 'background.paper',
          color: isVisible ? 'primary.contrastText' : 'text.primary',
          boxShadow: 2,
          pointerEvents: 'auto',
          animation: spinAnim === 'open' ? `${spin} 0.5s ease-out` : spinAnim === 'close' ? `${spinReverse} 0.5s ease-out` : 'none',
          '&:hover': {
            bgcolor: isVisible ? 'primary.dark' : 'action.hover',
          }
        }}
      >
        <Speed />
      </IconButton>

      <Collapse in={isVisible} timeout={300}>
        <Box sx={{ mt: 1 }}>
          {alerts.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1, borderRadius: 2 }}>
              Performance issues: {alerts.join(', ')}
            </Alert>
          )}
          
          <Card sx={{ width: 280, borderRadius: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  Performance
                </Typography>
                <IconButton size="small" onClick={handleToggle}>
                  <VisibilityOff fontSize="small" />
                </IconButton>
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">FPS</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                      {metrics?.fps.toFixed(1) || '--'}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={getFpsColor(metrics?.fps || 0)}
                      color={getFpsColor(metrics?.fps || 0) as any}
                      sx={{ fontSize: '0.6rem', height: 16 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Frame Time</Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                    {metrics?.frameTime.toFixed(1) || '--'}ms
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Memory</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {metrics ? formatBytes(metrics.memoryUsage) : '--'}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((metrics?.memoryUsage || 0) / (512 * 1024 * 1024) * 100, 100)}
                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Render Time</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {metrics?.renderTime.toFixed(2) || '--'}ms
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Collapse>
    </Box>
  );
};
