
import { useEffect } from 'react';
import { RenderMode } from '../types';
import { eventBus } from '../providers/EventBus';

interface ShortcutActions {
  onReset: () => void;
  onToggleBypass: () => void;
  onFullscreen: () => void;
  onCycleMode: () => void;
  onCycleDevice: () => void;
  onCancelCountdown?: () => void;
}

export const useKeyboardShortcuts = ({
  onReset,
  onToggleBypass,
  onFullscreen,
  onCycleMode,
  onCycleDevice,
  onCancelCountdown
}: ShortcutActions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape and Q always work for canceling countdowns
      if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
        onCancelCountdown?.();
        return;
      }

      // Ignore other keys if input is focused
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          onReset();
          break;
        case ' ':
          e.preventDefault();
          // Toggle recording
          eventBus.emit('recording:toggle');
          break;
        case 'c':
          e.preventDefault();
          // Capture photo
          eventBus.emit('recording:snapshot');
          break;
        case 'b':
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
  }, [onReset, onToggleBypass, onFullscreen, onCycleMode, onCycleDevice, onCancelCountdown]);
};
