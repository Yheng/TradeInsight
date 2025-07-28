import { DatabaseService } from '../database/DatabaseService'

// Setup test database
beforeAll(async () => {
  // Use in-memory database for tests
  process.env.DATABASE_URL = ':memory:'
  await DatabaseService.initialize()
})

afterAll(async () => {
  // Cleanup test database
  await DatabaseService.close()
})

// Clean up between tests
afterEach(async () => {
  // Clear all tables between tests
  const tables = ['users', 'trades', 'ai_analyses', 'risk_metrics', 'alerts', 'social_follows', 'social_posts']
  for (const table of tables) {
    try {
      await DatabaseService.run(`DELETE FROM ${table}`)
    } catch (error) {
      // Table might not exist, ignore
    }
  }
})