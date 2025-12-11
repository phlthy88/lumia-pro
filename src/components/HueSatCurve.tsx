import React, {} from 'react';
import { Box, Typography, Slider, Stack } from '@mui/material';

export interface HueSatPoint {
  hue: number;      // 0-360
  satShift: number; // -1 to 1
  hueShift: number; // -180 to 180
}

export interface HueSatConfig {
  enabled: boolean;
  points: HueSatPoint[];
}

export const DEFAULT_HUE_SAT: HueSatConfig = {
  enabled: false,
  points: [],
};

// Predefined color targets for quick selection
const COLOR_TARGETS = [
  { name: 'Reds', hue: 0, color: '#ff4444' },
  { name: 'Oranges', hue: 30, color: '#ff8844' },
  { name: 'Yellows', hue: 60, color: '#ffff44' },
  { name: 'Greens', hue: 120, color: '#44ff44' },
  { name: 'Cyans', hue: 180, color: '#44ffff' },
  { name: 'Blues', hue: 240, color: '#4444ff' },
  { name: 'Magentas', hue: 300, color: '#ff44ff' },
];

interface Props {
  config: HueSatConfig;
  onChange: (config: HueSatConfig) => void;
}

export const HueSatCurve: React.FC<Props> = ({ config, onChange }) => {
  const [selectedHue, setSelectedHue] = React.useState<number | null>(null);

  const getPointForHue = (hue: number): HueSatPoint | undefined => {
    return config.points.find(p => Math.abs(p.hue - hue) < 15);
  };

  const updatePoint = (hue: number, satShift: number, hueShift: number) => {
    const existing = config.points.findIndex(p => Math.abs(p.hue - hue) < 15);
    const newPoints = [...config.points];
    
    if (existing >= 0) {
      if (satShift === 0 && hueShift === 0) {
        newPoints.splice(existing, 1); // Remove if reset
      } else {
        newPoints[existing] = { hue, satShift, hueShift };
      }
    } else if (satShift !== 0 || hueShift !== 0) {
      newPoints.push({ hue, satShift, hueShift });
    }
    
    onChange({ ...config, points: newPoints });
  };

  const selectedPoint = selectedHue !== null ? getPointForHue(selectedHue) : undefined;

  return (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
        {COLOR_TARGETS.map(target => {
          const point = getPointForHue(target.hue);
          const isActive = point && (point.satShift !== 0 || point.hueShift !== 0);
          return (
            <Box
              key={target.name}
              onClick={() => setSelectedHue(target.hue)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: target.color,
                cursor: 'pointer',
                border: selectedHue === target.hue ? '2px solid white' : '2px solid transparent',
                opacity: isActive ? 1 : 0.5,
                '&:hover': { opacity: 1 },
              }}
              title={target.name}
            />
          );
        })}
      </Stack>

      {selectedHue !== null && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            {COLOR_TARGETS.find(t => t.hue === selectedHue)?.name || `Hue ${selectedHue}°`}
          </Typography>
          
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>Saturation</Typography>
          <Slider
            size="small"
            min={-1}
            max={1}
            step={0.05}
            value={selectedPoint?.satShift ?? 0}
            onChange={(_, v) => updatePoint(selectedHue, v as number, selectedPoint?.hueShift ?? 0)}
            valueLabelDisplay="auto"
            valueLabelFormat={v => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`}
          />

          <Typography variant="caption" display="block">Hue Shift</Typography>
          <Slider
            size="small"
            min={-60}
            max={60}
            step={1}
            value={selectedPoint?.hueShift ?? 0}
            onChange={(_, v) => updatePoint(selectedHue, selectedPoint?.satShift ?? 0, v as number)}
            valueLabelDisplay="auto"
            valueLabelFormat={v => `${v > 0 ? '+' : ''}${v}°`}
          />
        </Box>
      )}
    </Box>
  );
};

// Generate shader uniforms from config
export function generateHueSatUniforms(config: HueSatConfig): string {
  if (!config.enabled || config.points.length === 0) return '';
  
  // Pack up to 8 points into uniforms
  const points = config.points.slice(0, 8);
  return points.map((p, i) => 
    `uniform vec3 u_hueSat${i}; // x=hue, y=satShift, z=hueShift`
  ).join('\n');
}
