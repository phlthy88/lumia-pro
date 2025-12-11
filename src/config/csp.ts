/**
 * Content Security Policy configuration for production
 */

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for WebGL shaders
    "'wasm-unsafe-eval'" // Required for MediaPipe WASM
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'" // Required for MUI emotion styles
  ],
  'img-src': [
    "'self'",
    'blob:',
    'data:'
  ],
  'media-src': [
    "'self'",
    'blob:'
  ],
  'connect-src': [
    "'self'",
    'https://generativelanguage.googleapis.com', // Gemini API
    'wss://localhost:*', // Dev WebSocket
    'ws://localhost:*'   // Dev WebSocket
  ],
  'worker-src': [
    "'self'",
    'blob:'
  ],
  'font-src': [
    "'self'",
    'data:'
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

export function generateCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => 
      sources.length > 0 
        ? `${directive} ${sources.join(' ')}`
        : directive
    )
    .join('; ');
}
