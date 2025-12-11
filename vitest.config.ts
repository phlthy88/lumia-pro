import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    minWorkers: 1,
    maxWorkers: 2,
    fileParallelism: false,
    coverage: {
      enabled: false
    },
  },
});
