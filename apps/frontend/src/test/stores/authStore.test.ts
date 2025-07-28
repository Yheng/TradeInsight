import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'

// Mock the auth service
vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setAuthToken: vi.fn(),
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
    })
    vi.clearAllMocks()
  })

  it('initializes with null user and token', () => {
    const { user, token, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
    expect(isLoading).toBe(false)
  })

  it('sets loading state during login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'test' }
    const mockToken = 'fake-token'
    
    vi.mocked(authService.login).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    })

    const { login } = useAuthStore.getState()
    
    // Start login
    const loginPromise = login('test@example.com', 'password')
    
    // Check loading state
    expect(useAuthStore.getState().isLoading).toBe(true)
    
    await loginPromise
    
    // Check final state
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.user).toEqual(mockUser)
    expect(state.token).toBe(mockToken)
  })

  it('handles login error', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Login failed'))

    const { login } = useAuthStore.getState()
    
    await expect(login('test@example.com', 'wrong-password')).rejects.toThrow('Login failed')
    
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('clears user data on logout', () => {
    // Set initial state with user
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', username: 'test' },
      token: 'fake-token',
    })

    const { logout } = useAuthStore.getState()
    logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(authService.logout).toHaveBeenCalled()
  })
})