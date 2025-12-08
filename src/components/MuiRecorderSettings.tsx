import React, { useState, useEffect } from 'react';
import { Stack, Box } from '@mui/material';
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

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
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

    return (
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
                label="Audio Source"
                value={config.audioSource}
                options={audioOptions}
                onChange={(val) => setConfig(p => ({ ...p, audioSource: val }))}
            />
            {config.audioSource !== 'none' && (
                <Box sx={{ px: 1, py: 0.5 }}>
                    <AudioMeter audioStream={audioStream} variant="horizontal" />
                </Box>
            )}
            <MuiSelect 
                label="Countdown"
                value={config.countdown}
                options={countdownOptions}
                onChange={(val) => setConfig(p => ({ ...p, countdown: Number(val) }))}
            />
        </ControlCard>
    );
};
