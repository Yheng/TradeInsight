# Testing Guide

This document outlines the testing strategy and setup for TradeInsight.

## Testing Stack

### Frontend Testing
- **Unit Tests**: Vitest + React Testing Library
- **Component Tests**: Cypress Component Testing
- **E2E Tests**: Cypress
- **Coverage**: Vitest Coverage

### Backend Testing
- **Unit Tests**: Jest + Supertest
- **Integration Tests**: Jest with test database
- **API Tests**: Supertest for HTTP testing

## Running Tests

### All Tests
```bash
# Run all tests with coverage
npm run test:all

# Run specific workspace tests
npm run test:frontend
npm run test:api
```

### Frontend Tests
```bash
cd apps/frontend

# Unit tests
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage
npm run test:ui           # Interactive UI

# E2E tests
npm run test:e2e          # Headless
npm run test:e2e:open     # Interactive

# Component tests
npm run test:component    # Cypress component tests
```

### Backend Tests
```bash
cd apps/api

# Unit tests
npm run test              # Single run
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:ci           # CI mode
```

## Test Structure

### Frontend
```
apps/frontend/
├── src/
│   ├── test/
│   │   ├── setup.ts                 # Test setup
│   │   ├── components/              # Component tests
│   │   └── stores/                  # Store tests
│   └── **/*.test.tsx                # Co-located tests
├── cypress/
│   ├── e2e/                         # E2E tests
│   ├── support/                     # Test utilities
│   └── fixtures/                    # Test data
└── vitest.config.ts                 # Vitest config
```

### Backend
```
apps/api/
├── src/
│   ├── test/
│   │   ├── setup.ts                 # Test setup
│   │   └── routes/                  # Route tests
│   └── **/*.test.ts                 # Co-located tests
└── jest.config.js                   # Jest config
```

## Writing Tests

### Frontend Component Tests
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Frontend Store Tests
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useMyStore } from './myStore'

describe('MyStore', () => {
  beforeEach(() => {
    useMyStore.getState().reset()
  })
  
  it('updates state correctly', () => {
    const { updateData } = useMyStore.getState()
    updateData('test')
    expect(useMyStore.getState().data).toBe('test')
  })
})
```

### Backend API Tests
```typescript
import request from 'supertest'
import app from '../app'

describe('Auth Routes', () => {
  it('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200)
    
    expect(response.body.success).toBe(true)
  })
})
```

### E2E Tests
```typescript
describe('User Flow', () => {
  it('should complete login flow', () => {
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type('test@example.com')
    cy.get('[data-testid="password-input"]').type('password')
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('include', '/dashboard')
  })
})
```

## Test Data Management

### Fixtures
Place test data in `cypress/fixtures/` for E2E tests:
```json
// cypress/fixtures/user.json
{
  "email": "test@example.com",
  "username": "testuser",
  "firstName": "Test",
  "lastName": "User"
}
```

### Database Setup
Backend tests use an in-memory SQLite database that's reset between tests.

## Mocking

### Frontend Mocks
- API calls are mocked using Vitest's `vi.mock()`
- Cypress intercepts real API calls during E2E tests

### Backend Mocks
- External services are mocked in unit tests
- Integration tests use real database but isolated data

## Coverage Reports

Coverage reports are generated in:
- Frontend: `apps/frontend/coverage/`
- Backend: `apps/api/coverage/`

Minimum coverage thresholds:
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main/develop branches
- Scheduled nightly runs

The CI pipeline includes:
1. Linting and type checking
2. Unit and integration tests
3. E2E tests
4. Security scans
5. Coverage reporting

## Best Practices

1. **Test Naming**: Use descriptive test names
2. **AAA Pattern**: Arrange, Act, Assert
3. **Test Isolation**: Each test should be independent
4. **Data-testid**: Use `data-testid` for reliable element selection
5. **Mock External Dependencies**: Don't test third-party code
6. **Test User Behavior**: Focus on user interactions, not implementation
7. **Keep Tests Fast**: Unit tests should run quickly
8. **Regular Test Maintenance**: Update tests with code changes

## Debugging Tests

### Frontend
```bash
# Debug unit tests
npm run test:ui

# Debug E2E tests
npm run test:e2e:open
```

### Backend
```bash
# Debug with VS Code
npm run test:watch
# Then attach debugger to process
```

## Common Issues

1. **Async Operations**: Use proper async/await patterns
2. **State Cleanup**: Reset stores and clear mocks between tests
3. **Timing Issues**: Use `waitFor` for async operations
4. **Environment Variables**: Set test-specific environment variables