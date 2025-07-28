import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@tradeinsight/types'
import { authService } from '@/services/authService'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  setLoading: (loading: boolean) => void
  initializeAuth: () => void
}

interface RegisterData {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.login(email, password)
          set({
            user: response.user,
            token: response.token,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true })
        try {
          const response = await authService.register(userData)
          set({
            user: response.user,
            token: response.token,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null })
        authService.logout()
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      initializeAuth: () => {
        const token = get().token
        if (token) {
          authService.setAuthToken(token)
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          authService.setAuthToken(state.token)
        }
      }
    }
  )
)