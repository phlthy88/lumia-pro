import React, { useState } from 'react';
import { Box, Button, Typography, Alert, Link, Chip } from '@mui/material';
import { Videocam, ContentCopy, CheckCircle } from '@mui/icons-material';
import { ControlCard } from './controls/ControlCard';
import { UseVirtualCameraReturn } from '../hooks/useVirtualCamera';

interface VirtualCameraSettingsProps {
    virtualCamera: UseVirtualCameraReturn;
}

export const VirtualCameraSettings: React.FC<VirtualCameraSettingsProps> = ({ virtualCamera }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyUrl = () => {
        if (virtualCamera.webrtcUrl) {
            navigator.clipboard.writeText(virtualCamera.webrtcUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleStartWebRTC = () => {
        if (!virtualCamera.isActive) {
            virtualCamera.start();
        }
        virtualCamera.startWebRTC();
    };

    return (
        <ControlCard title="Virtual Camera Output">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info" sx={{ mb: 1 }}>
                    Use window sharing in your video call app to share Lumina's output as your camera feed.
                </Alert>

                {/* WebRTC Browser Source Method */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        OBS Browser Source
                    </Typography>
                    <Button
                        variant={virtualCamera.isStreaming ? "outlined" : "contained"}
                        startIcon={<Videocam />}
                        onClick={virtualCamera.isStreaming ? virtualCamera.stopWebRTC : handleStartWebRTC}
                        fullWidth
                        color={virtualCamera.isStreaming ? "success" : "primary"}
                    >
                        {virtualCamera.isStreaming ? 'Stop WebRTC Stream' : 'Start WebRTC Stream'}
                    </Button>
                    
                    {virtualCamera.isStreaming && virtualCamera.webrtcUrl && (
                        <Box sx={{ mt: 1 }}>
                            <Alert severity="success" sx={{ mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    Stream Active
                                </Typography>
                            </Alert>
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                alignItems: 'center',
                                p: 1,
                                bgcolor: 'action.hover',
                                borderRadius: 1
                            }}>
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        flex: 1, 
                                        fontFamily: 'monospace',
                                        fontSize: '0.7rem',
                                        wordBreak: 'break-all'
                                    }}
                                >
                                    {virtualCamera.webrtcUrl}
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                                    onClick={handleCopyUrl}
                                    color={copied ? "success" : "primary"}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Add this URL as a Browser Source in OBS (1920x1080)
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Status Chips */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                        label={virtualCamera.isActive ? "Camera Active" : "Camera Inactive"}
                        color={virtualCamera.isActive ? "success" : "default"}
                        size="small"
                    />
                    {virtualCamera.isStreaming && (
                        <Chip label="WebRTC Streaming" color="success" size="small" />
                    )}
                </Box>

                {/* Help Links */}
                <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Setup guides:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {['OBS', 'Zoom', 'Meet', 'Teams', 'Discord'].map((app) => (
                            <Link
                                key={app}
                                href="#"
                                variant="caption"
                                onClick={(e) => {
                                    e.preventDefault();
                                    alert(virtualCamera.getSetupInstructions(app.toLowerCase() as any));
                                }}
                            >
                                {app}
                            </Link>
                        ))}
                    </Box>
                </Box>
            </Box>
        </ControlCard>
    );
};
