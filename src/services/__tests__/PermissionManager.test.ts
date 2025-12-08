import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PermissionManager } from '../PermissionManager';

describe('PermissionManager', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('checkAll aggregates permissions', async () => {
        // Mock permissions.query
        const mockQuery = vi.fn().mockImplementation(({ name }) => {
            if (name === 'camera') return Promise.resolve({ state: 'granted' });
            if (name === 'microphone') return Promise.resolve({ state: 'denied' });
            return Promise.resolve({ state: 'prompt' });
        });
        Object.defineProperty(navigator, 'permissions', {
            value: { query: mockQuery },
            writable: true
        });

        // Mock MIDI check
        const requestMIDIAccess = vi.spyOn(navigator, 'requestMIDIAccess').mockImplementation(() => {
             throw new Error('Denied');
        });

        // Since we can't easily check MIDI "state" via permissions API in all browsers,
        // the manager likely checks query or fallback.
        // Based on implementation: check('midi') calls navigator.permissions.query({name:'midi'})
        // or returns prompt.

        const status = await PermissionManager.checkAll();

        expect(status.camera).toBe('granted');
        expect(status.microphone).toBe('denied');
        // MIDI defaults to prompt if query fails/throws or returns prompt
        expect(status.midi).toBe('prompt');
    });

    it('handles permission API missing gracefully', async () => {
        Object.defineProperty(navigator, 'permissions', { value: undefined, writable: true });

        const status = await PermissionManager.checkAll();
        expect(status.camera).toBe('prompt');
        expect(status.microphone).toBe('prompt');
    });
});
