describe('Dashboard', () => {
  beforeEach(() => {
    // Create test user and login
    cy.createTestUser()
    cy.login('test@example.com', 'Password123!')
  })

  it('should display dashboard components when authenticated', () => {
    cy.visit('/dashboard')
    
    // Check main dashboard elements
    cy.get('[data-testid="dashboard-header"]').should('be.visible')
    cy.get('[data-testid="trade-stats"]').should('be.visible')
    cy.get('[data-testid="risk-metrics"]').should('be.visible')
    cy.get('[data-testid="performance-chart"]').should('be.visible')
  })

  it('should show loading states initially', () => {
    cy.visit('/dashboard')
    
    // Check for loading spinners
    cy.get('[data-testid="loading-spinner"]').should('be.visible')
    
    // Wait for loading to complete
    cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist')
  })

  it('should display trade statistics', () => {
    cy.visit('/dashboard')
    
    // Wait for data to load
    cy.get('[data-testid="trade-stats"]').should('be.visible')
    
    // Check for key metrics
    cy.get('[data-testid="total-trades"]').should('be.visible')
    cy.get('[data-testid="win-rate"]').should('be.visible')
    cy.get('[data-testid="total-profit"]').should('be.visible')
  })

  it('should display risk metrics', () => {
    cy.visit('/dashboard')
    
    // Wait for data to load
    cy.get('[data-testid="risk-metrics"]').should('be.visible')
    
    // Check for risk indicators
    cy.get('[data-testid="sharpe-ratio"]').should('be.visible')
    cy.get('[data-testid="max-drawdown"]').should('be.visible')
    cy.get('[data-testid="risk-score"]').should('be.visible')
  })

  it('should handle navigation between dashboard sections', () => {
    cy.visit('/dashboard')
    
    // Test navigation
    cy.get('[data-testid="nav-trades"]').click()
    cy.url().should('include', '/trades')
    
    cy.get('[data-testid="nav-analytics"]').click()
    cy.url().should('include', '/analytics')
    
    cy.get('[data-testid="nav-dashboard"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should redirect to login when not authenticated', () => {
    // Logout first
    cy.logout()
    
    // Try to visit dashboard
    cy.visit('/dashboard')
    
    // Should redirect to login
    cy.url().should('include', '/login')
  })
})