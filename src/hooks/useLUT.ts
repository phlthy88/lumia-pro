import { useState, useCallback, useEffect } from 'react';

interface LUTInfo {
  name: string;
  path: string;
  category: 'film' | 'creative' | 'log' | 'bw';
  description: string;
}

interface LUTState {
  availableLUTs: LUTInfo[];
  selectedLUT: string | null;
  isLoading: boolean;
  error: string | null;
  lutData: ArrayBuffer | null;
}

const BUILT_IN_LUTS: LUTInfo[] = [
  { name: 'None', path: '', category: 'film', description: 'No LUT applied' },
  { name: 'Kodak Portra 400', path: '/luts/kodak-portra-400.cube', category: 'film', description: 'Classic film emulation' },
  { name: 'Fuji Provia', path: '/luts/fuji-provia.cube', category: 'film', description: 'Vibrant slide film look' },
  { name: 'Teal & Orange', path: '/luts/teal-orange.cube', category: 'creative', description: 'Hollywood blockbuster style' },
  { name: 'Matrix Green', path: '/luts/matrix-green.cube', category: 'creative', description: 'Cyberpunk aesthetic' },
  { name: 'S-Log3 to Rec709', path: '/luts/slog3-rec709.cube', category: 'log', description: 'Sony S-Log3 conversion' },
  { name: 'C-Log to Rec709', path: '/luts/clog-rec709.cube', category: 'log', description: 'Canon C-Log conversion' },
  { name: 'Classic B&W', path: '/luts/classic-bw.cube', category: 'bw', description: 'Timeless monochrome' },
  { name: 'Tri-X 400', path: '/luts/tri-x-400.cube', category: 'bw', description: 'Iconic black and white film' }
];

export const useLUT = () => {
  const [state, setState] = useState<LUTState>({
    availableLUTs: BUILT_IN_LUTS,
    selectedLUT: null,
    isLoading: false,
    error: null,
    lutData: null
  });

  const parseCubeFile = useCallback((text: string): Float32Array | null => {
    try {
      const lines = text.split('\n');
      let size = 32; // Default LUT size
      const data: number[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Parse LUT_3D_SIZE
        if (trimmed.startsWith('LUT_3D_SIZE')) {
          size = parseInt(trimmed.split(' ')[1]);
          continue;
        }

        // Skip comments and metadata
        if (trimmed.startsWith('#') || trimmed.startsWith('TITLE') || 
            trimmed.startsWith('DOMAIN_MIN') || trimmed.startsWith('DOMAIN_MAX') ||
            trimmed === '') {
          continue;
        }

        // Parse RGB values
        const values = trimmed.split(/\s+/).map(v => parseFloat(v));
        if (values.length === 3 && values.every(v => !isNaN(v))) {
          data.push(...values);
        }
      }

      // Validate data size
      const expectedSize = size * size * size * 3;
      if (data.length !== expectedSize) {
        throw new Error(`Invalid LUT data size: expected ${expectedSize}, got ${data.length}`);
      }

      return new Float32Array(data);
    } catch (error) {
      console.error('Failed to parse CUBE file:', error);
      return null;
    }
  }, []);

  const loadLUT = useCallback(async (lutPath: string): Promise<boolean> => {
    if (!lutPath) {
      setState(prev => ({ 
        ...prev, 
        selectedLUT: null, 
        lutData: null, 
        error: null 
      }));
      return true;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(lutPath);
      if (!response.ok) {
        throw new Error(`Failed to load LUT: ${response.statusText}`);
      }

      const text = await response.text();
      const lutData = parseCubeFile(text);

      if (!lutData) {
        throw new Error('Failed to parse LUT file');
      }

      setState(prev => ({
        ...prev,
        selectedLUT: lutPath,
        lutData: lutData.buffer,
        isLoading: false,
        error: null
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, [parseCubeFile]);

  const getLUTsByCategory = useCallback((category: LUTInfo['category']) => {
    return state.availableLUTs.filter(lut => lut.category === category);
  }, [state.availableLUTs]);

  const findLUTByPath = useCallback((path: string) => {
    return state.availableLUTs.find(lut => lut.path === path);
  }, [state.availableLUTs]);

  // Load default LUT on mount
  useEffect(() => {
    // Start with no LUT applied
    setState(prev => ({ ...prev, selectedLUT: null }));
  }, []);

  return {
    availableLUTs: state.availableLUTs,
    selectedLUT: state.selectedLUT,
    isLoading: state.isLoading,
    error: state.error,
    lutData: state.lutData,
    loadLUT,
    getLUTsByCategory,
    findLUTByPath
  };
};
