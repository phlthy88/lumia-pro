import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Reduce memory usage for CI/workers by limiting concurrency
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
    // Single-threaded test execution to reduce memory pressure
    fileParallelism: false,
    // Disable coverage by default (it increases memory usage)
    coverage: {
      enabled: false
    },
  },
})
