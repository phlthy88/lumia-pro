// Cypress E2E support file
import './commands';

// Disable uncaught exception handling for WebGL/MediaPipe errors
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on WebGL context errors
  if (err.message.includes('WebGL') || err.message.includes('MediaPipe')) {
    return false;
  }
  return true;
});
