import { describe, it, expect } from 'vitest';
import { Suspense } from 'react';
import { render } from '@testing-library/react';
import * as LazyComponents from '../LazyComponents';

describe('Lazy Components', () => {
  it('should export lazy-loaded components', () => {
    expect(LazyComponents.PlatformBoostsPanel).toBeDefined();
    expect(LazyComponents.MediaLibrary).toBeDefined();
    expect(LazyComponents.VirtualCameraSettings).toBeDefined();
    expect(LazyComponents.ThemeSettings).toBeDefined();
    expect(LazyComponents.AIController).toBeDefined();
    expect(LazyComponents.RecordingController).toBeDefined();
  });

  it('should render lazy component with suspense', async () => {
    const { getByText } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponents.ThemeSettings />
      </Suspense>
    );
    
    expect(getByText('Loading...')).toBeInTheDocument();
  });
});
