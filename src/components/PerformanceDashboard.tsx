import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, LinearProgress,
  Chip, Alert, IconButton
} from '@mui/material';
import { Speed, VisibilityOff } from '@mui/icons-material';
import { performanceMonitoringService } from '../services/PerformanceMonitoringService';

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

  useEffect(() => {
    performanceMonitoringService.startMonitoring(1000);
    
    const unsubscribe = performanceMonitoringService.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
      setAverages(performanceMonitoringService.getAverageMetrics());
    });

    const handlePerformanceAlert = (event: CustomEvent) => {
      setAlerts(event.detail.issues);
      setTimeout(() => setAlerts([]), 5000); // Clear after 5s
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

  if (!isVisible) {
    return (
      <IconButton
        onClick={() => setIsVisible(true)}
        sx={{ 
          position: 'fixed', 
          top: 16, 
          right: 16, 
          bgcolor: 'background.paper',
          boxShadow: 2,
          zIndex: 1300
        }}
      >
        <Speed />
      </IconButton>
    );
  }

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 16, 
      right: 16, 
      width: 320,
      zIndex: 1300
    }}>
      {alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Performance issues: {alerts.join(', ')}
        </Alert>
      )}
      
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Speed sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Performance
            </Typography>
            <IconButton size="small" onClick={() => setIsVisible(false)}>
              <VisibilityOff />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  FPS
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">
                    {metrics?.fps.toFixed(1) || '--'}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={getFpsColor(metrics?.fps || 0)}
                    color={getFpsColor(metrics?.fps || 0) as any}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Avg: {averages.fps?.toFixed(1) || '--'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Frame Time
                </Typography>
                <Typography variant="h6">
                  {metrics?.frameTime.toFixed(1) || '--'}ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg: {averages.frameTime?.toFixed(1) || '--'}ms
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Memory Usage
                </Typography>
                <Typography variant="body2">
                  {metrics ? formatBytes(metrics.memoryUsage) : '--'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((metrics?.memoryUsage || 0) / (512 * 1024 * 1024) * 100, 100)}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  GPU Memory (est.)
                </Typography>
                <Typography variant="body2">
                  {metrics ? formatBytes(metrics.gpuMemory) : '--'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Render Time
                </Typography>
                <Typography variant="body2">
                  {metrics?.renderTime.toFixed(2) || '--'}ms
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
