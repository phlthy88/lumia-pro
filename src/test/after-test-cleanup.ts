// Memory cleanup after each test to prevent OOM errors
import { afterEach, afterAll, vi } from 'vitest'

afterEach(() => {
  // Clear all mocks to release references
  vi.clearAllMocks()
  
  // Clear module registry to prevent memory leaks
  vi.resetModules()
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
})

afterAll(() => {
  // Clean up any remaining resources
  vi.restoreAllMocks()
  
  if (global.gc) {
    global.gc()
  }
})
