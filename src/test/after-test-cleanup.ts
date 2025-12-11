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
          } catch (e) {}
        }
      }
      
      // Remove canvas from DOM
      canvas.remove()
    } catch (e) {}
  })

  // Clean up media streams
  if (navigator.mediaDevices) {
    try {
      // Stop any active tracks
      const streams = []
      if (navigator.mediaDevices.activeStreams) {
        navigator.mediaDevices.activeStreams.forEach(stream => {
          if (stream.getTracks) {
            stream.getTracks().forEach(track => track.stop())
          }
        })
      }
    } catch (e) {}
  }

  // Clear blob URLs
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('blob:')) {
        try { URL.revokeObjectURL(key) } catch (e) {}
        try { localStorage.removeItem(key) } catch (e) {}
      }
    })
  } catch (e) {}

  // Clean up global variables that might hold references
  try {
    // Clear any global test state
    Object.keys(window).forEach(key => {
      if (key.includes('test') || key.includes('mock')) {
        try { delete window[key] } catch (e) {}
      }
    })
  } catch (e) {}

  // Clear localStorage for test keys
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('test') || key.includes('mock')) {
        localStorage.removeItem(key)
      }
    })
  } catch (e) {}

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
})

// Cleanup after all tests
afterAll(() => {
  // Clean up any remaining resources
  document.body.innerHTML = ''
  
  // Clear all mocks
  vi.restoreAllMocks()
  
  // Final garbage collection
  if (global.gc) {
    global.gc()
  }
})
