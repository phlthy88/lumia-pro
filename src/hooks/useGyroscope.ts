import { useState, useEffect, useRef } from 'react';

export const useGyroscope = (enableState: boolean = true) => {
  const [gyroAngle, setGyroAngle] = useState(0);
  const gyroRef = useRef(0);

  useEffect(() => {
    let sensor: RelativeOrientationSensor | null = null;

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
            const [, , z, w] = sensor.quaternion;
            const gamma = Math.asin(2 * (w * z)) * (180 / Math.PI);
            updateAngle(gamma);
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
