import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CameraController single stream', () => {
  it('contains exactly one useCameraStream call', () => {
    const source = readFileSync(join(__dirname, '../CameraController.tsx'), 'utf-8');
    const matches = source.match(/useCameraStream\(/g) || [];
    expect(matches.length).toBe(1);
  });
});
