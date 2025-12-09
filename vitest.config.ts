import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest configuration
// Install dependencies: npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
const isCI = process.env.CI === 'true';

// Give vitest workers more headroom on CI runners to avoid V8 OOMs
if (isCI && !process.env.NODE_OPTIONS?.includes('--max-old-space-size')) {
  const existing = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : '';
  process.env.NODE_OPTIONS = `${existing}--max-old-space-size=6144`.trim();
}

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/'
      ]
    },
    ...(isCI ? {
      maxWorkers: 1,
      fileParallelism: false,
    } : {}),
    exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        'e2e/**' // Exclude Playwright tests
    ]
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
