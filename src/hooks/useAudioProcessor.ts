import { useRef, useCallback } from 'react';

interface AudioProcessorConfig {
  enabled: boolean;
  gateThreshold: number;
  compThreshold: number;
  compRatio: number;
  eqLowCut: number;
  eqHighBoost: number;
}

const DEFAULT_CONFIG: AudioProcessorConfig = {
  enabled: true,
  gateThreshold: -50,
  compThreshold: -24,
  compRatio: 12,
  eqLowCut: 80,
  eqHighBoost: 8000,
};

export const useAudioProcessor = () => {
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    source?: MediaStreamAudioSourceNode;
    gate?: DynamicsCompressorNode;
    compressor?: DynamicsCompressorNode;
    lowCut?: BiquadFilterNode;
    highBoost?: BiquadFilterNode;
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

    // Chain: source -> lowCut -> gate -> compressor -> highBoost -> destination
    source.connect(lowCut);
    lowCut.connect(gate);
    gate.connect(compressor);
    compressor.connect(highBoost);
    highBoost.connect(destination);

    nodesRef.current = { source, gate, compressor, lowCut, highBoost, destination };

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
