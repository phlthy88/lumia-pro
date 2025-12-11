// Custom Cypress commands for Lumia Pro

declare global {
  namespace Cypress {
    interface Chainable {
      allowCamera(): Chainable<void>;
      waitForApp(): Chainable<void>;
    }
  }
}

// Allow camera permissions
Cypress.Commands.add('allowCamera', () => {
  cy.window().then((win) => {
    // Mock getUserMedia for testing
    cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
      getTracks: () => [{ stop: cy.stub() }],
      getVideoTracks: () => [{ stop: cy.stub() }],
      getAudioTracks: () => []
    } as any);
  });
});

// Wait for app to be ready
Cypress.Commands.add('waitForApp', () => {
  cy.get('[data-testid="app-ready"]', { timeout: 10000 }).should('exist');
});
