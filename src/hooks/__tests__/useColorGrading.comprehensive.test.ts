import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useColorGrading } from '../useColorGrading';
import { RenderMode } from '../../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useColorGrading - Comprehensive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('initialization', () => {
    it('initializes with default color values', () => {
      const { result } = renderHook(() => useColorGrading());
      
      expect(result.current.color.exposure).toBe(0);
      expect(result.current.color.contrast).toBe(1);
      expect(result.current.color.saturation).toBe(1);
      expect(result.current.color.temperature).toBe(0);
    });

    it('initializes with default transform values', () => {
      const { result } = renderHook(() => useColorGrading());
      
      expect(result.current.transform.zoom).toBe(1);
      expect(result.current.transform.panX).toBe(0);
      expect(result.current.transform.panY).toBe(0);
      expect(result.current.transform.rotate).toBe(0);
      expect(result.current.transform.flipX).toBe(false);
      expect(result.current.transform.flipY).toBe(false);
    });

    it('initializes with standard render mode', () => {
      const { result } = renderHook(() => useColorGrading());
      
      expect(result.current.mode).toBe(RenderMode.Standard);
    });

    it('initializes with bypass disabled', () => {
      const { result } = renderHook(() => useColorGrading());
      
      expect(result.current.bypass).toBe(false);
    });

    it('loads user presets from localStorage', () => {
      const savedPresets = [
        { id: 'user1', name: 'My Preset', timestamp: Date.now(), data: { color: {} } }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPresets));
      
      renderHook(() => useColorGrading());
      
      expect(localStorageMock.getItem).toHaveBeenCalled();
    });
  });

  describe('color changes', () => {
    it('updates exposure', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('exposure', 0.5);
      });

      expect(result.current.color.exposure).toBe(0.5);
    });

    it('updates contrast', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('contrast', 1.5);
      });

      expect(result.current.color.contrast).toBe(1.5);
    });

    it('updates saturation', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('saturation', 0.8);
      });

      expect(result.current.color.saturation).toBe(0.8);
    });

    it('updates temperature', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('temperature', -0.3);
      });

      expect(result.current.color.temperature).toBe(-0.3);
    });

    it('updates tint', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('tint', 0.2);
      });

      expect(result.current.color.tint).toBe(0.2);
    });

    it('updates highlights', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('highlights', 0.3);
      });

      expect(result.current.color.highlights).toBe(0.3);
    });

    it('updates shadows', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('shadows', -0.2);
      });

      expect(result.current.color.shadows).toBe(-0.2);
    });

    it('updates blacks', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('blacks', 0.1);
      });

      expect(result.current.color.blacks).toBe(0.1);
    });

    it('updates vignette', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('vignette', 0.5);
      });

      expect(result.current.color.vignette).toBe(0.5);
    });

    it('updates sharpness', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('sharpness', 0.3);
      });

      expect(result.current.color.sharpness).toBe(0.3);
    });

    it('updates grain', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('grain', 0.2);
      });

      expect(result.current.color.grain).toBe(0.2);
    });

    it('updates lutStrength', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('lutStrength', 0.8);
      });

      expect(result.current.color.lutStrength).toBe(0.8);
    });

    it('updates lift', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('lift', 0.1);
      });

      expect(result.current.color.lift).toBe(0.1);
    });

    it('updates gamma', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('gamma', 0.1);
      });

      expect(result.current.color.gamma).toBe(0.1);
    });

    it('updates gain', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleColorChange('gain', 0.1);
      });

      expect(result.current.color.gain).toBe(0.1);
    });
  });

  describe('transform changes', () => {
    it('updates zoom', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleTransformChange('zoom', 1.5);
      });

      expect(result.current.transform.zoom).toBe(1.5);
    });

    it('updates panX', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleTransformChange('panX', 0.1);
      });

      expect(result.current.transform.panX).toBe(0.1);
    });

    it('updates panY', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleTransformChange('panY', -0.1);
      });

      expect(result.current.transform.panY).toBe(-0.1);
    });

    it('updates rotate', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleTransformChange('rotate', 45);
      });

      expect(result.current.transform.rotate).toBe(45);
    });

    it('updates flipX', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleTransformChange('flipX', true);
      });

      expect(result.current.transform.flipX).toBe(true);
    });

    it('updates flipY', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.handleTransformChange('flipY', true);
      });

      expect(result.current.transform.flipY).toBe(true);
    });
  });

  describe('render mode', () => {
    it('changes render mode', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.setMode(RenderMode.FocusPeaking);
      });

      expect(result.current.mode).toBe(RenderMode.FocusPeaking);
    });

    it('supports zebras mode', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.setMode(RenderMode.Zebras);
      });

      expect(result.current.mode).toBe(RenderMode.Zebras);
    });
  });

  describe('bypass', () => {
    it('toggles bypass', () => {
      const { result } = renderHook(() => useColorGrading());

      expect(result.current.bypass).toBe(false);

      act(() => {
        result.current.toggleBypass();
      });

      expect(result.current.bypass).toBe(true);

      act(() => {
        result.current.toggleBypass();
      });

      expect(result.current.bypass).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all to defaults', () => {
      const { result } = renderHook(() => useColorGrading());

      // Make changes
      act(() => {
        result.current.handleColorChange('exposure', 0.5);
        result.current.handleColorChange('contrast', 1.5);
        result.current.handleTransformChange('zoom', 2);
      });

      // Reset
      act(() => {
        result.current.resetAll();
      });

      expect(result.current.color.exposure).toBe(0);
      expect(result.current.color.contrast).toBe(1);
      expect(result.current.transform.zoom).toBe(1);
    });
  });

  describe('undo', () => {
    it('can undo changes', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.setColor({ ...result.current.color, exposure: 0.5 });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.color.exposure).toBe(0);
    });

    it('reports canUndo correctly', () => {
      const { result } = renderHook(() => useColorGrading());

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.setColor({ ...result.current.color, exposure: 0.5 });
      });

      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('presets', () => {
    it('includes factory presets', () => {
      const { result } = renderHook(() => useColorGrading());

      expect(result.current.presets.length).toBeGreaterThan(0);
      expect(result.current.presets.some(p => p.isFactory)).toBe(true);
    });

    it('includes cinematic factory preset', () => {
      const { result } = renderHook(() => useColorGrading());

      const cinematic = result.current.presets.find(p => p.id === 'fp_cine');
      expect(cinematic).toBeDefined();
      expect(cinematic?.name).toContain('Cinematic');
    });

    it('includes noir factory preset', () => {
      const { result } = renderHook(() => useColorGrading());

      const noir = result.current.presets.find(p => p.id === 'fp_noir');
      expect(noir).toBeDefined();
      expect(noir?.name).toContain('Noir');
    });

    it('includes broadcast factory preset', () => {
      const { result } = renderHook(() => useColorGrading());

      const broadcast = result.current.presets.find(p => p.id === 'fp_broadcast');
      expect(broadcast).toBeDefined();
      expect(broadcast?.name).toContain('Broadcast');
    });

    it('includes blockbuster factory preset', () => {
      const { result } = renderHook(() => useColorGrading());

      const blockbuster = result.current.presets.find(p => p.id === 'fp_tealorange');
      expect(blockbuster).toBeDefined();
      expect(blockbuster?.name).toContain('Blockbuster');
    });

    it('loads preset by id', () => {
      const { result } = renderHook(() => useColorGrading());
      
      act(() => {
        result.current.loadPreset('fp_cine');
      });

      // Cinematic preset has contrast 1.2
      expect(result.current.color.contrast).toBe(1.2);
    });

    it('loads noir preset correctly', () => {
      const { result } = renderHook(() => useColorGrading());
      
      act(() => {
        result.current.loadPreset('fp_noir');
      });

      // Noir preset has saturation 0 (black and white)
      expect(result.current.color.saturation).toBe(0);
    });

    it('saves user preset', () => {
      const { result } = renderHook(() => useColorGrading());
      
      act(() => {
        result.current.savePreset('My Custom Preset');
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('deletes user preset', () => {
      const savedPresets = [
        { id: 'user1', name: 'My Preset', timestamp: Date.now(), data: { color: {} } }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPresets));
      
      const { result } = renderHook(() => useColorGrading());
      
      act(() => {
        result.current.deletePreset('user1');
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('setColor', () => {
    it('sets entire color state', () => {
      const { result } = renderHook(() => useColorGrading());

      const newColor = {
        ...result.current.color,
        exposure: 0.3,
        contrast: 1.2,
        saturation: 0.9,
      };

      act(() => {
        result.current.setColor(newColor);
      });

      expect(result.current.color.exposure).toBe(0.3);
      expect(result.current.color.contrast).toBe(1.2);
      expect(result.current.color.saturation).toBe(0.9);
    });

    it('adds to history stack', () => {
      const { result } = renderHook(() => useColorGrading());

      act(() => {
        result.current.setColor({ ...result.current.color, exposure: 0.5 });
      });

      expect(result.current.canUndo).toBe(true);
    });
  });
});
