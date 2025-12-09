import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { MuiSelect } from './controls/MuiSelect';
import { MuiSwitch } from './controls/MuiToggle';
import { ControlCard } from './controls/ControlCard';
import { RecorderConfig, AudioConfig, AudioPreset, AUDIO_PRESETS } from '../types';
import { AudioMeter } from './AudioMeter';

interface RecorderSettingsProps {
    config: RecorderConfig;
    setConfig: React.Dispatch<React.SetStateAction<RecorderConfig>>;
    audioConfig: AudioConfig;
    setAudioConfig: React.Dispatch<React.SetStateAction<AudioConfig>>;
    audioStream?: MediaStream | null;
}

export const MuiRecorderSettings: React.FC<RecorderSettingsProps> = ({ config, setConfig, audioConfig, setAudioConfig, audioStream }) => {
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
            setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
        });
    }, []);

    const applyPreset = (preset: AudioPreset) => {
        const settings = AUDIO_PRESETS[preset];
        setAudioConfig({ ...settings, preset });
    };

    const handleAudioChange = <K extends keyof AudioConfig>(key: K, value: AudioConfig[K]) => {
        setAudioConfig(prev => ({ ...prev, [key]: value, preset: 'custom' as AudioPreset }));
    };

    const aiActive = audioConfig.noiseSuppression || audioConfig.echoCancellation || audioConfig.autoGainControl;

    const formatOptions = [
        { value: "video/webm;codecs=vp9", label: "WebM (VP9)" },
        { value: "video/webm;codecs=h264", label: "WebM (H.264)" },
        { value: "video/mp4", label: "MP4" },
    ];

    const bitrateOptions = [
        { value: 1000000, label: "1 Mbps (Low)" },
        { value: 2500000, label: "2.5 Mbps (Medium)" },
        { value: 5000000, label: "5 Mbps (High)" },
        { value: 10000000, label: "10 Mbps (Ultra)" },
    ];

    const audioOptions = [
        { value: "none", label: "No Audio" },
        ...audioDevices.map(d => ({ value: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0,4)}` }))
    ];

    const countdownOptions = [
        { value: 0, label: "None" },
        { value: 3, label: "3 Seconds" },
        { value: 5, label: "5 Seconds" },
        { value: 10, label: "10 Seconds" },
    ];

    const burstOptions = [
        { value: 1, label: "Single Shot" },
        { value: 3, label: "3 Photos" },
        { value: 5, label: "5 Photos" },
        { value: 10, label: "10 Photos" },
    ];

    const burstDelayOptions = [
        { value: 100, label: "100ms (Fast)" },
        { value: 200, label: "200ms" },
        { value: 500, label: "500ms" },
        { value: 1000, label: "1 Second" },
    ];

    const presetOptions: { value: AudioPreset; label: string }[] = [
        { value: 'custom', label: 'Custom' },
        { value: 'bandwidth_saver', label: '📶 Bandwidth Saver' },
        { value: 'video_conference', label: '💼 Video Conference' },
        { value: 'asmr', label: '🎧 ASMR' },
        { value: 'podcast', label: '🎙️ Podcast' },
        { value: 'broadcast', label: '📺 Broadcast' },
    ];

    const sampleRateOptions = [
        { value: 16000, label: '16 kHz' },
        { value: 22050, label: '22.05 kHz' },
        { value: 44100, label: '44.1 kHz' },
        { value: 48000, label: '48 kHz' },
    ];

    const channelOptions = [
        { value: 1, label: 'Mono' },
        { value: 2, label: 'Stereo' },
    ];

    return (
        <>
            <ControlCard title="Recording Setup">
                <MuiSelect 
                    label="Format"
                    value={config.mimeType}
                    options={formatOptions}
                    onChange={(val) => setConfig(p => ({ ...p, mimeType: val }))}
                />
                <MuiSelect 
                    label="Bitrate"
                    value={config.bitrate}
                    options={bitrateOptions}
                    onChange={(val) => setConfig(p => ({ ...p, bitrate: Number(val) }))}
                />
                <MuiSelect 
                    label="Video Countdown"
                    value={config.countdown}
                    options={countdownOptions}
                    onChange={(val) => setConfig(p => ({ ...p, countdown: Number(val) }))}
                />
            </ControlCard>
            <ControlCard 
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Audio
                        {aiActive && (
                            <Chip 
                                icon={<AutoFixHighIcon sx={{ fontSize: 14 }} />} 
                                label="AI" 
                                size="small" 
                                color="primary"
                                sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: 11 } }}
                            />
                        )}
                    </Box>
                }
            >
                <MuiSelect 
                    label="Microphone"
                    value={config.audioSource}
                    options={audioOptions}
                    onChange={(val) => setConfig(p => ({ ...p, audioSource: val }))}
                />
                {config.audioSource !== 'none' && (
                    <>
                        <Box sx={{ px: 1, pt: 1, pb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Input Level</Typography>
                            <AudioMeter audioStream={audioStream} variant="horizontal" />
                        </Box>
                        
                        <MuiSelect 
                            label="Preset Profile"
                            value={audioConfig.preset}
                            options={presetOptions}
                            onChange={(val) => applyPreset(val as AudioPreset)}
                        />
                        
                        <Typography variant="caption" color="text.secondary" sx={{ px: 1, pt: 1, display: 'block' }}>
                            AI Processing
                        </Typography>
                        <MuiSwitch 
                            label="Noise Suppression" 
                            checked={audioConfig.noiseSuppression} 
                            onChange={(v: boolean) => handleAudioChange('noiseSuppression', v)} 
                        />
                        <MuiSwitch 
                            label="Echo Cancellation" 
                            checked={audioConfig.echoCancellation} 
                            onChange={(v: boolean) => handleAudioChange('echoCancellation', v)} 
                        />
                        <MuiSwitch 
                            label="Auto Gain Control" 
                            checked={audioConfig.autoGainControl} 
                            onChange={(v: boolean) => handleAudioChange('autoGainControl', v)} 
                        />
                        
                        <Typography variant="caption" color="text.secondary" sx={{ px: 1, pt: 1, display: 'block' }}>
                            Format
                        </Typography>
                        <MuiSelect 
                            label="Sample Rate"
                            value={audioConfig.sampleRate}
                            options={sampleRateOptions}
                            onChange={(val) => handleAudioChange('sampleRate', Number(val))}
                        />
                        <MuiSelect 
                            label="Channels"
                            value={audioConfig.channelCount}
                            options={channelOptions}
                            onChange={(val) => handleAudioChange('channelCount', Number(val) as 1 | 2)}
                        />
                    </>
                )}
                {audioOutputDevices.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1, pt: 1 }}>
                        Output: {audioOutputDevices[0]?.label || 'Default'}
                    </Typography>
                )}
            </ControlCard>
            <ControlCard title="Photo Capture">
                <MuiSelect 
                    label="Photo Countdown"
                    value={config.photoCountdown}
                    options={countdownOptions}
                    onChange={(val) => setConfig(p => ({ ...p, photoCountdown: Number(val) }))}
                />
                <MuiSelect 
                    label="Burst Count"
                    value={config.burstCount}
                    options={burstOptions}
                    onChange={(val) => setConfig(p => ({ ...p, burstCount: Number(val) }))}
                />
                <MuiSelect 
                    label="Burst Delay"
                    value={config.burstDelay}
                    options={burstDelayOptions}
                    onChange={(val) => setConfig(p => ({ ...p, burstDelay: Number(val) }))}
                    disabled={config.burstCount <= 1}
                />
            </ControlCard>
        </>
    );
};
