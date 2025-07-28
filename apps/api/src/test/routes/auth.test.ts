import request from 'supertest'
import express from 'express'
import authRoutes from '../../routes/auth'
// import { DatabaseService } from '../../database/DatabaseService' // Currently unused

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.username).toBe(userData.username)
      expect(response.body.data.token).toBeDefined()
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Password validation failed')
    })

    it('should reject duplicate user registration', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      }

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      // Try to register same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('User with this email or username already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      }

      await request(app)
        .post('/api/auth/register')
        .send(userData)
    })

    it('should login with email successfully', async () => {
      const loginData = {
        emailOrUsername: 'test@example.com',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.token).toBeDefined()
    })

    it('should login with username successfully', async () => {
      const loginData = {
        emailOrUsername: 'testuser',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.username).toBe('testuser')
      expect(response.body.data.token).toBeDefined()
    })

    it('should reject login with wrong password', async () => {
      const loginData = {
        emailOrUsername: 'test@example.com',
        password: 'WrongPassword123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should reject login with non-existent user', async () => {
      const loginData = {
        emailOrUsername: 'nonexistent@example.com',
        password: 'Password123!'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })
  })
})