
import { useEffect } from 'react';
import { RenderMode } from '../types';

interface ShortcutActions {
  onReset: () => void;
  onToggleBypass: () => void;
  onFullscreen: () => void;
  onCycleMode: () => void;
  onCycleDevice: () => void;
}

export const useKeyboardShortcuts = ({
  onReset,
  onToggleBypass,
  onFullscreen,
  onCycleMode,
  onCycleDevice
}: ShortcutActions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          onReset();
          break;
        case ' ':
          e.preventDefault();
          onToggleBypass();
          break;
        case 'f':
          onFullscreen();
          break;
        case 'm':
          onCycleMode();
          break;
        case 'd':
          onCycleDevice();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReset, onToggleBypass, onFullscreen, onCycleMode, onCycleDevice]);
};
