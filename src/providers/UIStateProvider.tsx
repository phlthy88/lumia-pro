import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface UIState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showToast: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
  sidebarPosition: 'left' | 'right';
  setSidebarPosition: (pos: 'left' | 'right') => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
}

const UIStateContext = createContext<UIState | null>(null);

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) throw new Error('useUIState must be used within UIStateProvider');
  return context;
};

interface UIStateProviderProps {
  children: ReactNode;
  // Optional handlers for shortcuts that need to be delegated to controllers
  shortcuts?: {
    onReset?: () => void;
    onToggleBypass?: () => void;
    onFullscreen?: () => void;
    onCycleMode?: () => void;
    onCycleDevice?: () => void;
    onCancelCountdown?: () => void;
  };
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ children, shortcuts }) => {
  const [activeTab, setActiveTab] = useState('ADJUST');
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('right');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Toast State
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const showToast = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ open: true, message, severity });
  }, []);

  const handleCloseToast = () => setToast(prev => ({ ...prev, open: false }));

  // Network Status Monitoring
  React.useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      showToast('You are offline. Some features may be unavailable.', 'warning');
    };
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Connection restored.', 'success');
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [showToast]);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onReset: shortcuts?.onReset ?? (() => {}),
    onToggleBypass: shortcuts?.onToggleBypass ?? (() => {}),
    onFullscreen: shortcuts?.onFullscreen ?? (() => {}),
    onCycleMode: shortcuts?.onCycleMode ?? (() => {}),
    onCycleDevice: shortcuts?.onCycleDevice ?? (() => {}),
    onCancelCountdown: shortcuts?.onCancelCountdown ?? (() => {}),
  });

  return (
    <UIStateContext.Provider value={{
      activeTab,
      setActiveTab,
      showToast,
      sidebarPosition,
      setSidebarPosition,
      isOffline,
      setIsOffline
    }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={handleCloseToast}>
          {toast.message}
        </Alert>
      </Snackbar>
    </UIStateContext.Provider>
  );
};
