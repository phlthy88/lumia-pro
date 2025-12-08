import { useState, useEffect, useRef } from 'react';

export const useGyroscope = (enableState: boolean = true) => {
  const [gyroAngle, setGyroAngle] = useState(0);
  const gyroRef = useRef(0);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Gamma is left-to-right tilt in degrees (-90 to 90)
      if (e.gamma !== null) {
        gyroRef.current = e.gamma;
        if (enableState) {
            setGyroAngle(e.gamma);
        }
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enableState]);

  return { gyroAngle, gyroRef };
};