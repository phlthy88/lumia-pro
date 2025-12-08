import { useState, useCallback, useEffect } from 'react';
import { ColorGradeParams, TransformParams, RenderMode, Preset } from '../types';

const DEFAULT_COLOR: ColorGradeParams = {
  exposure: 0,
  contrast: 1.0,
  saturation: 1.0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  blacks: 0,
  lift: 0.0,
  gamma: 0.0,
  gain: 0.0,
  highlightRoll: 0,
  shadowRoll: 0,
  vignette: 0.2,
  sharpness: 0.1,
  denoise: 0.0,
  grain: 0.05,
  portraitLight: 0.0,
  distortion: 0.0,
  lutStrength: 1.0,
  skinSmoothing: 0.0,
};

const DEFAULT_TRANSFORM: TransformParams = {
  zoom: 1.0,
  panX: 0,
  panY: 0,
  rotate: 0,
};

const FACTORY_PRESETS: Preset[] = [
    {
        id: 'fp_cine', name: 'Factory: Cinematic', timestamp: 0, isFactory: true,
        data: { color: { ...DEFAULT_COLOR, contrast: 1.2, saturation: 0.8, blacks: 0.1, vignette: 0.4, grain: 0.15 }, transform: DEFAULT_TRANSFORM }
    },
    {
        id: 'fp_noir', name: 'Factory: Film Noir', timestamp: 0, isFactory: true,
        data: { color: { ...DEFAULT_COLOR, saturation: 0, contrast: 1.4, grain: 0.3, exposure: 0.2, vignette: 0.5 }, transform: DEFAULT_TRANSFORM }
    },
    {
        id: 'fp_broadcast', name: 'Factory: Broadcast', timestamp: 0, isFactory: true,
        data: { color: { ...DEFAULT_COLOR, saturation: 1.1, sharpness: 0.3, denoise: 0.2, contrast: 1.05 }, transform: DEFAULT_TRANSFORM }
    },
    {
        id: 'fp_tealorange', name: 'Factory: Blockbuster', timestamp: 0, isFactory: true,
        data: { color: { ...DEFAULT_COLOR, temperature: -0.3, shadows: -0.2, highlights: 0.2, contrast: 1.15 }, transform: DEFAULT_TRANSFORM }
    }
];

const STORAGE_KEY = 'lumina_presets_v3';

export const useColorGrading = () => {
  const [color, setColorState] = useState<ColorGradeParams>({ ...DEFAULT_COLOR });
  const [transform, setTransform] = useState<TransformParams>({ ...DEFAULT_TRANSFORM });
  const [mode, setMode] = useState<RenderMode>(RenderMode.Standard);
  const [userPresets, setUserPresets] = useState<Preset[]>([]);
  const [bypass, setBypass] = useState(false);

  // Simple History Stack for Color changes
  const [history, setHistory] = useState<ColorGradeParams[]>([DEFAULT_COLOR]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUserPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load presets", e);
    }
  }, []);

  const presets = [...FACTORY_PRESETS, ...userPresets];

  // Internal Helper to push state
  const pushColorState = useCallback((newColor: ColorGradeParams) => {
    // If we are not at end of history, slice it
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newColor);
    
    // Limit history size to 20
    if (newHistory.length > 20) newHistory.shift();

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setColorState(newColor);
  }, [history, historyIndex]);

  const handleColorChange = useCallback((key: keyof ColorGradeParams, value: number) => {
    // For slider dragging, we usually debounce history, but for simplicity here we just update state
    // and rely on a "commit" or just update directly.
    // To avoid spamming history on drag, we update state directly here, but for "Auto Fix" we use setColor.
    setColorState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setColor = useCallback((newColor: ColorGradeParams) => {
      pushColorState(newColor);
  }, [pushColorState]);

  const undo = useCallback(() => {
      if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          const prevState = history[prevIndex];
          setHistoryIndex(prevIndex);
          if (prevState) setColorState(prevState);
      }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;

  const handleTransformChange = useCallback((key: keyof TransformParams, value: number) => {
    setTransform(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = useCallback(() => {
    setColor({ ...DEFAULT_COLOR });
    setTransform({ ...DEFAULT_TRANSFORM });
    setMode(RenderMode.Standard);
  }, [setColor]);

  const toggleBypass = useCallback(() => setBypass(prev => !prev), []);

  const savePreset = useCallback((name: string) => {
    const newPreset: Preset = {
      id: crypto.randomUUID(),
      name,
      timestamp: Date.now(),
      data: {
        color: { ...color },
        transform: { ...transform }
      }
    };
    const updated = [newPreset, ...userPresets];
    setUserPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [color, transform, userPresets]);

  const loadPreset = useCallback((id: string) => {
    const p = presets.find(pre => pre.id === id);
    if (p) {
      setColor({ ...DEFAULT_COLOR, ...p.data.color });
      setTransform(p.data.transform);
    }
  }, [presets, setColor]);

  const deletePreset = useCallback((id: string) => {
    const updated = userPresets.filter(p => p.id !== id);
    setUserPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [userPresets]);

  const importPresets = useCallback((jsonStr: string) => {
    try {
      const imported = JSON.parse(jsonStr);
      if (Array.isArray(imported)) {
        // Validate preset structure before importing
        const isValidPreset = (p: unknown): p is Preset => {
          if (!p || typeof p !== 'object') return false;
          const preset = p as Record<string, unknown>;
          return (
            typeof preset.id === 'string' &&
            typeof preset.name === 'string' &&
            preset.data !== null &&
            typeof preset.data === 'object' &&
            (preset.data as Record<string, unknown>).color !== undefined
          );
        };
        
        const validPresets = imported.filter(isValidPreset);
        if (validPresets.length === 0) {
          alert("No valid presets found in file");
          return;
        }
        if (validPresets.length < imported.length) {
          console.warn(`Skipped ${imported.length - validPresets.length} invalid presets`);
        }
        
        const merged = [...userPresets, ...validPresets];
        const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setUserPresets(unique);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
      } else {
        alert("Invalid Preset File: Expected an array of presets");
      }
    } catch (e) {
      alert("Invalid Preset File: Could not parse JSON");
    }
  }, [userPresets]);

  const exportPresets = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userPresets));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lumina_presets.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [userPresets]);

  return {
    color,
    transform,
    mode,
    bypass,
    presets,
    setMode,
    toggleBypass,
    handleColorChange,
    setColor,
    undo,
    canUndo,
    handleTransformChange,
    resetAll,
    savePreset,
    loadPreset,
    deletePreset,
    importPresets,
    exportPresets
  };
};
