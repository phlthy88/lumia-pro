import { useState, useEffect, useRef } from 'react';

type Quaternion = [number, number, number, number] | Float32Array | Float64Array;

interface RelativeOrientationSensorType {
  quaternion?: Quaternion;
  addEventListener: (type: 'reading', listener: () => void) => void;
  start: () => void;
  stop: () => void;
}

declare const RelativeOrientationSensor: {
  new (options?: { frequency?: number }): RelativeOrientationSensorType;
};

export const useGyroscope = (enableState: boolean = true) => {
  const [gyroAngle, setGyroAngle] = useState(0);
  const gyroRef = useRef(0);

  useEffect(() => {
    let sensor: RelativeOrientationSensorType | null = null;

    const updateAngle = (angle: number) => {
      gyroRef.current = angle;
      if (enableState) setGyroAngle(angle);
    };

    // Try modern Sensor API first
    if ('RelativeOrientationSensor' in window) {
      try {
        sensor = new RelativeOrientationSensor({ frequency: 60 });
        sensor.addEventListener('reading', () => {
          if (sensor?.quaternion) {
            // Convert quaternion to gamma-like tilt (-90 to 90)
            const values = Array.from(sensor.quaternion);
            if (values.length >= 4 && values[2] !== undefined && values[3] !== undefined) {
              const z = values[2];
              const w = values[3];
              const gamma = Math.asin(2 * (w * z)) * (180 / Math.PI);
              updateAngle(gamma);
            }
          }
        });
        sensor.start();
        return () => sensor?.stop();
      } catch {
        // Sensor API failed, fall through to legacy
      }
    }

    // Fallback to deprecated deviceorientation
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) updateAngle(e.gamma);
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [enableState]);

  return { gyroAngle, gyroRef };
};
