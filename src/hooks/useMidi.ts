import { useEffect, useCallback, useState, useRef } from 'react';
import { ColorGradeParams } from '../types';

interface MidiMapping {
  cc: number;
  param: keyof ColorGradeParams;
  min: number;
  max: number;
}

const DEFAULT_MAPPINGS: MidiMapping[] = [
  { cc: 1, param: 'exposure', min: -2, max: 2 },
  { cc: 2, param: 'contrast', min: 0.5, max: 1.5 },
  { cc: 3, param: 'saturation', min: 0, max: 2 },
  { cc: 4, param: 'temperature', min: -1, max: 1 },
  { cc: 5, param: 'tint', min: -1, max: 1 },
  { cc: 6, param: 'highlights', min: -1, max: 1 },
  { cc: 7, param: 'shadows', min: -1, max: 1 },
  { cc: 8, param: 'vignette', min: 0, max: 1 },
];

export const useMidi = (
  onColorChange: (key: keyof ColorGradeParams, value: number) => void
) => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [connected, setConnected] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [lastVelocity, setLastVelocity] = useState(0);
  const inputsRef = useRef<MIDIInput[]>([]);

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;
    
    const [status, cc, velocity] = Array.from(data);
    if (status === undefined || cc === undefined || velocity === undefined) return;
    
    setLastVelocity(velocity);
    
    if (status === 176) { // Control Change
      const mapping = DEFAULT_MAPPINGS.find(m => m.cc === cc);
      if (mapping) {
        const normalized = velocity / 127;
        const value = mapping.min + normalized * (mapping.max - mapping.min);
        onColorChange(mapping.param, value);
      }
    }
  }, [onColorChange]);

  const requestAccess = useCallback(() => {
    if (!navigator.requestMIDIAccess || midiAccess) return;
    setEnabled(true);
  }, [midiAccess]);

  const disconnect = useCallback(() => {
    inputsRef.current.forEach(input => {
      input.onmidimessage = null;
    });
    inputsRef.current = [];
    setMidiAccess(null);
    setConnected(false);
    setEnabled(false);
    setLastVelocity(0);
  }, []);

  useEffect(() => {
    if (!enabled || !navigator.requestMIDIAccess || midiAccess) return;

    let isMounted = true;

    navigator.requestMIDIAccess()
      .then(access => {
        if (!isMounted) return;
        setMidiAccess(access);
        
        access.inputs.forEach(input => {
          input.onmidimessage = handleMidiMessage;
          inputsRef.current.push(input);
          setConnected(true);
        });

        access.onstatechange = (e) => {
          if (!isMounted) return;
          const port = e.port as MIDIInput;
          if (port.type === 'input') {
            if (port.state === 'connected') {
              port.onmidimessage = handleMidiMessage;
              inputsRef.current.push(port);
              setConnected(true);
            } else {
              setConnected(false);
            }
          }
        };
      })
      .catch(() => {
        if (isMounted) setConnected(false);
      });

    return () => {
      isMounted = false;
      disconnect();
    };
  }, [enabled, midiAccess, handleMidiMessage, disconnect]);

  return { connected, midiAccess, requestAccess, disconnect, enabled, lastVelocity };
};
