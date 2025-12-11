import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Lazy load AI components to reduce main bundle size
const AISettingsPanel = lazy(() => 
  import('../controllers/AIController').then(m => ({ 
    default: m.AISettingsPanel 
  }))
);

export const AIPanel: React.FC = () => {
  return (
    <Suspense 
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      }
    >
      <AISettingsPanel />
    </Suspense>
  );
};
