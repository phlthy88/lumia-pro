import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { MuiSelect } from './controls/MuiSelect';
import { ControlCard } from './controls/ControlCard';
import { RecorderConfig } from '../types';
import { AudioMeter } from './AudioMeter';

interface RecorderSettingsProps {
    config: RecorderConfig;
    setConfig: React.Dispatch<React.SetStateAction<RecorderConfig>>;
    audioStream?: MediaStream | null;
}

export const MuiRecorderSettings: React.FC<RecorderSettingsProps> = ({ config, setConfig, audioStream }) => {
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
            setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
        });
    }, []);

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
            <ControlCard title="Audio">
                <MuiSelect 
                    label="Microphone"
                    value={config.audioSource}
                    options={audioOptions}
                    onChange={(val) => setConfig(p => ({ ...p, audioSource: val }))}
                />
                {config.audioSource !== 'none' && (
                    <Box sx={{ px: 1, pt: 1, pb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Input Level</Typography>
                        <AudioMeter audioStream={audioStream} variant="horizontal" />
                    </Box>
                )}
                {audioOutputDevices.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
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
