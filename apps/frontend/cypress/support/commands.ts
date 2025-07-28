// Custom Cypress commands for TradeInsight

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      createTestUser(): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('not.include', '/login')
})

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

// Create test user command
Cypress.Commands.add('createTestUser', () => {
  cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    },
    failOnStatusCode: false
  })
})

export {}