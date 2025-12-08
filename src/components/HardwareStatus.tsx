import React from 'react';
import { Box, Chip, Stack, Typography, Button } from '@mui/material';
import { Videocam, Mic, Piano, CheckCircle, Cancel, Help } from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';

export const HardwareStatus: React.FC = () => {
    const { status, requestCamera, requestMicrophone, requestMidi } = usePermissions();

    const renderChip = (
        label: string,
        state: PermissionState,
        icon: React.ElementType,
        onRequest: () => void
    ) => {
        let color: 'default' | 'success' | 'error' | 'warning' = 'default';
        let IconStatus = Help;

        if (state === 'granted') {
            color = 'success';
            IconStatus = CheckCircle;
        } else if (state === 'denied') {
            color = 'error';
            IconStatus = Cancel;
        } else {
            color = 'warning';
        }

        return (
            <Chip
                icon={<IconStatus />}
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{label}</Typography>
                        {state === 'prompt' && (
                            <Button
                                size="small"
                                variant="contained"
                                sx={{ py: 0, px: 1, minWidth: 0, fontSize: '0.7rem' }}
                                onClick={onRequest}
                            >
                                Enable
                            </Button>
                        )}
                    </Box>
                }
                color={color}
                variant={state === 'prompt' ? 'outlined' : 'filled'}
            />
        );
    };

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {renderChip('Camera', status.camera, Videocam, requestCamera)}
            {renderChip('Mic', status.microphone, Mic, requestMicrophone)}
            {renderChip('MIDI', status.midi, Piano, requestMidi)}
        </Stack>
    );
};
