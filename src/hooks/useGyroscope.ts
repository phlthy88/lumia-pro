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
    let usingSensor = false;

    const updateAngle = (angle: number) => {
      gyroRef.current = angle;
      if (enableState) setGyroAngle(angle);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) updateAngle(e.gamma);
    };

    // Try modern Sensor API first
    if ('RelativeOrientationSensor' in window) {
      try {
        sensor = new RelativeOrientationSensor({ frequency: 60 });
        sensor.addEventListener('reading', () => {
          if (sensor?.quaternion) {
            const values = Array.from(sensor.quaternion);
            if (values.length >= 4 && values[2] !== undefined && values[3] !== undefined) {
              const gamma = Math.asin(2 * (values[3] * values[2])) * (180 / Math.PI);
              updateAngle(gamma);
            }
          }
        });
        sensor.start();
        usingSensor = true;
      } catch {
        // Sensor API failed, fall through to legacy
        usingSensor = false;
      }
    }

    // Fallback to deprecated deviceorientation only if sensor failed
    if (!usingSensor) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (sensor) sensor.stop();
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enableState]);

  return { gyroAngle, gyroRef };
};
