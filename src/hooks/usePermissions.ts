import { useState, useEffect, useCallback } from 'react';
import { PermissionManager, PermissionStatus } from '../services/PermissionManager';

export const usePermissions = () => {
    const [status, setStatus] = useState<PermissionStatus>({
        camera: 'prompt',
        microphone: 'prompt',
        midi: 'prompt'
    });

    const checkPermissions = useCallback(async () => {
        const result = await PermissionManager.checkAll();
        setStatus(result);
    }, []);

    useEffect(() => {
        checkPermissions();
        // Optional: Poll or listen for changes if needed
        // navigator.permissions.query... onchange
    }, [checkPermissions]);

    const requestCamera = async () => {
        const granted = await PermissionManager.requestCamera();
        if (granted) checkPermissions();
        return granted;
    };

    const requestMicrophone = async () => {
        const granted = await PermissionManager.requestMicrophone();
        if (granted) checkPermissions();
        return granted;
    };

    const requestMidi = async () => {
        const granted = await PermissionManager.requestMidi();
        if (granted) checkPermissions();
        return granted;
    };

    return {
        status,
        requestCamera,
        requestMicrophone,
        requestMidi,
        refresh: checkPermissions
    };
};
