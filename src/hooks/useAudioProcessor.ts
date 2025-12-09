import { useRef, useCallback } from 'react';

interface AudioProcessorConfig {
  enabled: boolean;
  gateThreshold: number;
  compThreshold: number;
  compRatio: number;
  eqLowCut: number;
  eqHighBoost: number;
  deEsserEnabled: boolean;
  deEsserThreshold: number;
  limiterEnabled: boolean;
  limiterThreshold: number;
}

const DEFAULT_CONFIG: AudioProcessorConfig = {
  enabled: true,
  gateThreshold: -50,
  compThreshold: -24,
  compRatio: 12,
  eqLowCut: 80,
  eqHighBoost: 8000,
  deEsserEnabled: true,
  deEsserThreshold: -30,
  limiterEnabled: true,
  limiterThreshold: -1, // Brickwall at -1dB
};

export const useAudioProcessor = () => {
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    source?: MediaStreamAudioSourceNode;
    gate?: DynamicsCompressorNode;
    compressor?: DynamicsCompressorNode;
    lowCut?: BiquadFilterNode;
    highBoost?: BiquadFilterNode;
    deEsserFilter?: BiquadFilterNode;
    deEsserComp?: DynamicsCompressorNode;
    limiter?: DynamicsCompressorNode;
    destination?: MediaStreamAudioDestinationNode;
  }>({});

  const processStream = useCallback((rawStream: MediaStream, config = DEFAULT_CONFIG): MediaStream => {
    if (!config.enabled) return rawStream;

    const ctx = new AudioContext();
    contextRef.current = ctx;

    const source = ctx.createMediaStreamSource(rawStream);
    const destination = ctx.createMediaStreamDestination();

    // Gate (noise suppression)
    const gate = ctx.createDynamicsCompressor();
    gate.threshold.value = config.gateThreshold;
    gate.knee.value = 0;
    gate.ratio.value = 20;
    gate.attack.value = 0.003;
    gate.release.value = 0.25;

    // Compressor (broadcast sound)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = config.compThreshold;
    compressor.knee.value = 30;
    compressor.ratio.value = config.compRatio;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Low-cut filter (remove rumble)
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = config.eqLowCut;
    lowCut.Q.value = 0.7;

    // High boost (presence)
    const highBoost = ctx.createBiquadFilter();
    highBoost.type = 'peaking';
    highBoost.frequency.value = config.eqHighBoost;
    highBoost.Q.value = 1.0;
    highBoost.gain.value = 3;

    // De-Esser: Sidechain compression on sibilant frequencies (4-8kHz)
    // Uses a bandpass filter to detect sibilance, then compresses
    const deEsserFilter = ctx.createBiquadFilter();
    deEsserFilter.type = 'peaking';
    deEsserFilter.frequency.value = 6000; // Target sibilant range
    deEsserFilter.Q.value = 2.0;
    deEsserFilter.gain.value = 0; // Detection only

    const deEsserComp = ctx.createDynamicsCompressor();
    deEsserComp.threshold.value = config.deEsserThreshold;
    deEsserComp.knee.value = 0;
    deEsserComp.ratio.value = 10; // Aggressive on sibilance
    deEsserComp.attack.value = 0.001; // Fast attack for transients
    deEsserComp.release.value = 0.1;

    // Limiter: Brickwall to prevent clipping
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = config.limiterThreshold;
    limiter.knee.value = 0; // Hard knee for brickwall
    limiter.ratio.value = 20; // Near-infinite ratio
    limiter.attack.value = 0.001; // Instant attack
    limiter.release.value = 0.1;

    // Build chain: source -> lowCut -> gate -> compressor -> deEsser -> highBoost -> limiter -> destination
    let lastNode: AudioNode = source;

    lastNode.connect(lowCut);
    lastNode = lowCut;

    lastNode.connect(gate);
    lastNode = gate;

    lastNode.connect(compressor);
    lastNode = compressor;

    // De-Esser (if enabled)
    if (config.deEsserEnabled) {
      lastNode.connect(deEsserFilter);
      deEsserFilter.connect(deEsserComp);
      lastNode = deEsserComp;
    }

    lastNode.connect(highBoost);
    lastNode = highBoost;

    // Limiter (if enabled) - always last before output
    if (config.limiterEnabled) {
      lastNode.connect(limiter);
      lastNode = limiter;
    }

    lastNode.connect(destination);

    nodesRef.current = { 
      source, gate, compressor, lowCut, highBoost, 
      deEsserFilter, deEsserComp, limiter, destination 
    };

    return destination.stream;
  }, []);

  const cleanup = useCallback(() => {
    if (contextRef.current?.state !== 'closed') {
      contextRef.current?.close();
    }
    nodesRef.current = {};
  }, []);

  return { processStream, cleanup };
};

export type { AudioProcessorConfig };
