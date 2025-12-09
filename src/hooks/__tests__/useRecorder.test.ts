import { describe, it, expect } from 'vitest';
import { AUDIO_PRESETS, AudioPreset, AudioConfig } from '../../types';

describe('Audio Configuration', () => {
  describe('AUDIO_PRESETS', () => {
    const presetNames: AudioPreset[] = [
      'custom',
      'bandwidth_saver',
      'video_conference',
      'asmr',
      'podcast',
      'broadcast'
    ];

    it('should have all expected presets', () => {
      presetNames.forEach(name => {
        expect(AUDIO_PRESETS[name]).toBeDefined();
      });
    });

    it('bandwidth_saver should minimize data usage', () => {
      const preset = AUDIO_PRESETS.bandwidth_saver;
      expect(preset.sampleRate).toBe(16000); // Low sample rate
      expect(preset.channelCount).toBe(1); // Mono
      expect(preset.noiseSuppression).toBe(true);
    });

    it('asmr should preserve audio quality', () => {
      const preset = AUDIO_PRESETS.asmr;
      expect(preset.noiseSuppression).toBe(false); // No processing
      expect(preset.echoCancellation).toBe(false);
      expect(preset.autoGainControl).toBe(false);
      expect(preset.sampleRate).toBe(48000); // High quality
      expect(preset.channelCount).toBe(2); // Stereo
    });

    it('broadcast should have full AI processing', () => {
      const preset = AUDIO_PRESETS.broadcast;
      expect(preset.noiseSuppression).toBe(true);
      expect(preset.echoCancellation).toBe(true);
      expect(preset.autoGainControl).toBe(true);
      expect(preset.sampleRate).toBe(48000);
      expect(preset.channelCount).toBe(2);
    });

    it('video_conference should optimize for calls', () => {
      const preset = AUDIO_PRESETS.video_conference;
      expect(preset.noiseSuppression).toBe(true);
      expect(preset.echoCancellation).toBe(true);
      expect(preset.autoGainControl).toBe(true);
      expect(preset.channelCount).toBe(1); // Mono for bandwidth
    });

    it('podcast should have selective processing', () => {
      const preset = AUDIO_PRESETS.podcast;
      expect(preset.noiseSuppression).toBe(true);
      expect(preset.echoCancellation).toBe(false); // No echo in solo recording
      expect(preset.autoGainControl).toBe(true);
      expect(preset.channelCount).toBe(1);
    });

    it('all presets should have valid sample rates', () => {
      const validRates = [16000, 22050, 44100, 48000];
      Object.values(AUDIO_PRESETS).forEach(preset => {
        expect(validRates).toContain(preset.sampleRate);
      });
    });

    it('all presets should have valid channel counts', () => {
      Object.values(AUDIO_PRESETS).forEach(preset => {
        expect([1, 2]).toContain(preset.channelCount);
      });
    });
  });

  describe('AudioConfig type', () => {
    it('should create valid config from preset', () => {
      const preset = AUDIO_PRESETS.broadcast;
      const config: AudioConfig = {
        ...preset,
        preset: 'broadcast'
      };
      
      expect(config.preset).toBe('broadcast');
      expect(config.noiseSuppression).toBe(true);
    });

    it('should allow custom config', () => {
      const config: AudioConfig = {
        noiseSuppression: true,
        echoCancellation: false,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 2,
        preset: 'custom'
      };
      
      expect(config.preset).toBe('custom');
      expect(config.sampleRate).toBe(44100);
    });
  });
});

describe('MediaTrackConstraints Generation', () => {
  it('should generate valid audio constraints', () => {
    const audioConfig: AudioConfig = {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1,
      preset: 'video_conference'
    };

    const constraints: MediaTrackConstraints = {
      noiseSuppression: audioConfig.noiseSuppression,
      echoCancellation: audioConfig.echoCancellation,
      autoGainControl: audioConfig.autoGainControl,
      sampleRate: audioConfig.sampleRate,
      channelCount: audioConfig.channelCount,
    };

    expect(constraints.noiseSuppression).toBe(true);
    expect(constraints.echoCancellation).toBe(true);
    expect(constraints.autoGainControl).toBe(true);
    expect(constraints.sampleRate).toBe(48000);
    expect(constraints.channelCount).toBe(1);
  });
});
