describe('Critical User Paths', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.allowCamera();
  });

  it('should load app and show camera interface', () => {
    cy.waitForApp();
    cy.get('[data-testid="camera-view"]').should('be.visible');
  });

  it('should apply LUT and see visual change', () => {
    cy.waitForApp();
    
    // Open LUT panel
    cy.get('[data-testid="lut-panel-toggle"]').click();
    
    // Select a LUT
    cy.get('[data-testid="lut-item"]').first().click();
    
    // Verify LUT is applied
    cy.get('[data-testid="active-lut"]').should('contain.text', 'Active');
  });

  it('should start and stop recording', () => {
    cy.waitForApp();
    
    // Start recording
    cy.get('[data-testid="record-button"]').click();
    cy.get('[data-testid="recording-indicator"]').should('be.visible');
    
    // Wait a moment
    cy.wait(2000);
    
    // Stop recording
    cy.get('[data-testid="record-button"]').click();
    cy.get('[data-testid="recording-indicator"]').should('not.exist');
  });

  it('should change performance mode', () => {
    cy.waitForApp();
    
    // Open performance settings
    cy.get('[data-testid="performance-toggle"]').click();
    
    // Change to performance mode
    cy.get('[data-testid="performance-mode-performance"]').click();
    
    // Verify mode changed
    cy.get('[data-testid="current-performance-mode"]').should('contain', 'Performance');
  });
});
