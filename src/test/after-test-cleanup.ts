// Memory cleanup after each test to prevent OOM errors
import { afterEach, afterAll, vi } from 'vitest'

afterEach(() => {
  // Clear all mocks to release references
  vi.clearAllMocks()
  
  // Clean up canvas elements and WebGL contexts
  const canvases = document.querySelectorAll('canvas')
  canvases.forEach(canvas => {
    try {
      // Get and clean up WebGL contexts
      const gl2 = canvas.getContext('webgl2')
      const gl = canvas.getContext('webgl')
      
      if (gl2 || gl) {
        const context = gl2 || gl
        if (context && typeof context.getExtension === 'function') {
          try {
            const loseContext = context.getExtension('WEBGL_lose_context')
            if (loseContext) loseContext.loseContext()
          } catch {
            // WebGL context cleanup may fail in test environment
          }
        }
      }
      
      // Remove canvas from DOM
      canvas.remove()
    } catch {
      // Canvas cleanup errors are non-critical in tests
    }
  })

  // Clean up media streams
  try {
    // Stop any active tracks from stored streams
    if ((window as unknown as Record<string, unknown>).__test_streams__) {
      ((window as unknown as Record<string, unknown>).__test_streams__ as MediaStream[]).forEach((stream: MediaStream) => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
        }
      })
      ;(window as unknown as Record<string, unknown>).__test_streams__ = []
    }
  } catch {
    // Media stream cleanup errors are non-critical
  }

  // Clear blob URLs
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('blob:')) {
        try { URL.revokeObjectURL(key) } catch { /* ignore */ }
        try { localStorage.removeItem(key) } catch { /* ignore */ }
      }
    })
  } catch {
    // localStorage access may fail in some test environments
  }

  // Clean up global variables that might hold references
  try {
    ;(window as unknown as Record<string, unknown>).__test_streams__ = undefined
    ;(window as unknown as Record<string, unknown>).__test_canvas__ = undefined
  } catch {
    // Global cleanup errors are non-critical
  }

  // Clear localStorage for test keys
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('test') || key.includes('mock')) {
        localStorage.removeItem(key)
      }
    })
  } catch {
    // localStorage cleanup errors are non-critical
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
})

// Cleanup after all tests
afterAll(() => {
  // Clean up any remaining resources
  try {
    document.body.innerHTML = ''
  } catch {
    // DOM cleanup errors are non-critical
  }
  
  // Clear all mocks
  vi.restoreAllMocks()
  
  // Final garbage collection
  if (global.gc) {
    global.gc()
  }
})
