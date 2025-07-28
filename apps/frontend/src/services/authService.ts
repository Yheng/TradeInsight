import axios from 'axios'
import { User } from '@tradeinsight/types'

// Use relative URL to take advantage of Vite proxy in development
const API_BASE_URL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || 'http://localhost:3000') : ''

interface LoginResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
}

interface RegisterData {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
}

class AuthService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api/auth`,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    // Also set for the main API instance
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  removeAuthToken() {
    delete this.api.defaults.headers.common['Authorization']
    delete axios.defaults.headers.common['Authorization']
  }

  async login(emailOrUsername: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await this.api.post<LoginResponse>('/login', {
        emailOrUsername,
        password,
      })

      if (response.data.success) {
        this.setAuthToken(response.data.data.token)
        return response.data.data
      } else {
        throw new Error('Login failed')
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Login failed. Please try again.')
    }
  }

  async register(userData: RegisterData): Promise<{ user: User; token: string }> {
    try {
      const response = await this.api.post<LoginResponse>('/register', userData)

      if (response.data.success) {
        this.setAuthToken(response.data.data.token)
        return response.data.data
      } else {
        throw new Error('Registration failed')
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      if (error.response?.data?.details) {
        const details = error.response.data.details
        const firstError = details[0]?.msg || 'Registration failed'
        throw new Error(firstError)
      }
      throw new Error('Registration failed. Please try again.')
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get('/me')
      return response.data.data
    } catch (error) {
      throw new Error('Failed to get current user')
    }
  }

  logout() {
    this.removeAuthToken()
  }
}

export const authService = new AuthService()