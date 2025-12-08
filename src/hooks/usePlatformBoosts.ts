// ============================================================================
// usePlatformBoosts - React Hook for Platform Optimizations
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import platformBoostsService, { 
  PlatformCapabilities, 
  BoostProfile,
  CHROME_FLAGS_RECOMMENDATIONS 
} from '../services/PlatformBoostsService';

export interface UsePlatformBoostsReturn {
  // State
  capabilities: PlatformCapabilities | null;
  currentProfile: BoostProfile | null;
  isDetecting: boolean;
  error: string | null;

  // Actions
  detectCapabilities: () => Promise<void>;
  setProfile: (profile: BoostProfile) => void;
  applyRecommended: () => void;
  
  // Helpers
  getRecommendedFlags: () => typeof CHROME_FLAGS_RECOMMENDATIONS;
  generateLaunchScript: () => string;
  copyFlagsToClipboard: () => Promise<void>;
  
  // Quick checks
  isHighEnd: boolean;
  isLowEnd: boolean;
  isCrostini: boolean;
  supportsHDR: boolean;
  supportsWebGPU: boolean;
}

export function usePlatformBoosts(): UsePlatformBoostsReturn {
  const [capabilities, setCapabilities] = useState<PlatformCapabilities | null>(null);
  const [currentProfile, setCurrentProfile] = useState<BoostProfile | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect on mount
  useEffect(() => {
    detectCapabilities();
  }, []);

  const detectCapabilities = useCallback(async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const caps = await platformBoostsService.detectCapabilities();
      setCapabilities(caps);
      
      // Load saved profile or use recommended
      const savedProfile = platformBoostsService.getBoostProfile();
      setCurrentProfile(savedProfile || caps.recommendedBoosts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to detect platform capabilities');
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const setProfile = useCallback((profile: BoostProfile) => {
    platformBoostsService.setBoostProfile(profile);
    setCurrentProfile(profile);
  }, []);

  const applyRecommended = useCallback(() => {
    if (capabilities) {
      setProfile(capabilities.recommendedBoosts);
    }
  }, [capabilities, setProfile]);

  const getRecommendedFlags = useCallback(() => {
    return platformBoostsService.getRecommendedFlags();
  }, []);

  const generateLaunchScript = useCallback(() => {
    return platformBoostsService.generateFlagsScript();
  }, []);

  const copyFlagsToClipboard = useCallback(async () => {
    const flags = getRecommendedFlags();
    const allSafeFlags = [
      ...flags.crostiniSafe,
      ...flags.webgl2Boosts.filter(f => f.safe),
      ...flags.webgpuBoosts.filter(f => f.safe),
      ...flags.performanceBoosts.filter(f => f.safe)
    ];

    const flagString = allSafeFlags.map(f => `--${f.flag}`).join(' ');
    
    try {
      await navigator.clipboard.writeText(flagString);
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = flagString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [getRecommendedFlags]);

  // Computed values
  const isHighEnd = capabilities ? 
    (navigator.hardwareConcurrency >= 8 && (navigator as any).deviceMemory >= 8) : false;
  
  const isLowEnd = capabilities ? 
    (navigator.hardwareConcurrency <= 4 || (navigator as any).deviceMemory <= 4) : false;
  
  const isCrostini = capabilities?.isCrostini ?? false;
  const supportsHDR = capabilities?.hdr.supported ?? false;
  const supportsWebGPU = capabilities?.webgpu.supported ?? false;

  return {
    capabilities,
    currentProfile,
    isDetecting,
    error,
    detectCapabilities,
    setProfile,
    applyRecommended,
    getRecommendedFlags,
    generateLaunchScript,
    copyFlagsToClipboard,
    isHighEnd,
    isLowEnd,
    isCrostini,
    supportsHDR,
    supportsWebGPU
  };
}

export default usePlatformBoosts;
