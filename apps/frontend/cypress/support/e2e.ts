// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global before hook to set up test environment
before(() => {
  // Any global setup that should run once before all tests
})

beforeEach(() => {
  // Clear localStorage and cookies before each test
  cy.clearLocalStorage()
  cy.clearCookies()
  
  // Intercept API calls to prevent actual API calls during tests
  cy.intercept('GET', '/api/**', { fixture: 'default-response.json' }).as('apiCall')
})