import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Lazy load recording components to reduce main bundle size
const RecordingSettings = lazy(() => 
  import('../controllers/RecordingController').then(m => ({ 
    default: m.RecordingSettings 
  }))
);

export const RecorderPanel: React.FC = () => {
  return (
    <Suspense 
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      }
    >
      <RecordingSettings />
    </Suspense>
  );
};
