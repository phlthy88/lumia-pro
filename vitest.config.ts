import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    maxWorkers: 1,
    minWorkers: 1,
    fileParallelism: false,
    coverage: { enabled: false },
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
    globals: true,
  },
});
