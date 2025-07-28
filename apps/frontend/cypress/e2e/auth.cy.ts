describe('Authentication Flow', () => {
  beforeEach(() => {
    // Create test user before each test
    cy.createTestUser()
  })

  describe('Login', () => {
    it('should allow user to login with valid credentials', () => {
      cy.visit('/login')
      
      // Check that login form is visible
      cy.get('[data-testid="login-form"]').should('be.visible')
      
      // Fill in login form
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('Password123!')
      
      // Submit form
      cy.get('[data-testid="login-button"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      
      // Should show user info
      cy.get('[data-testid="user-menu"]').should('contain', 'Test')
    })

    it('should reject login with invalid credentials', () => {
      cy.visit('/login')
      
      // Fill in login form with wrong password
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      
      // Submit form
      cy.get('[data-testid="login-button"]').click()
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible')
      
      // Should stay on login page
      cy.url().should('include', '/login')
    })

    it('should show validation errors for empty fields', () => {
      cy.visit('/login')
      
      // Try to submit empty form
      cy.get('[data-testid="login-button"]').click()
      
      // Should show validation errors
      cy.get('[data-testid="email-error"]').should('be.visible')
      cy.get('[data-testid="password-error"]').should('be.visible')
    })
  })

  describe('Registration', () => {
    it('should allow user to register with valid data', () => {
      cy.visit('/register')
      
      // Fill in registration form
      cy.get('[data-testid="email-input"]').type('newuser@example.com')
      cy.get('[data-testid="username-input"]').type('newuser')
      cy.get('[data-testid="firstName-input"]').type('New')
      cy.get('[data-testid="lastName-input"]').type('User')
      cy.get('[data-testid="password-input"]').type('Password123!')
      
      // Submit form
      cy.get('[data-testid="register-button"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      
      // Should show user info
      cy.get('[data-testid="user-menu"]').should('contain', 'New')
    })

    it('should reject registration with existing email', () => {
      cy.visit('/register')
      
      // Fill in registration form with existing email
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="username-input"]').type('newuser')
      cy.get('[data-testid="firstName-input"]').type('New')
      cy.get('[data-testid="lastName-input"]').type('User')
      cy.get('[data-testid="password-input"]').type('Password123!')
      
      // Submit form
      cy.get('[data-testid="register-button"]').click()
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible')
      
      // Should stay on registration page
      cy.url().should('include', '/register')
    })
  })

  describe('Logout', () => {
    it('should allow user to logout', () => {
      // Login first
      cy.login('test@example.com', 'Password123!')
      
      // Should be on dashboard
      cy.url().should('include', '/dashboard')
      
      // Logout
      cy.logout()
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })
})