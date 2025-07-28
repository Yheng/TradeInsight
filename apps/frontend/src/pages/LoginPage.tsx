import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Activity, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface LoginForm {
  emailOrUsername: string
  password: string
}

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('')
      await login(data.emailOrUsername, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-white text-xl font-semibold">TradeInsight</span>
          </div>
          <div className="text-gray-400 text-sm">
            EN
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Login Card */}
          <div className="card p-8">
            <h2 className="text-white text-2xl font-semibold text-center mb-6">Login</h2>
            
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-3 py-2 rounded-md text-sm" role="alert" aria-live="assertive">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium form-label mb-1">
                  Email
                </label>
                <input
                  {...register('emailOrUsername', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^@]+@[^@]+\.[^@]+$/,
                      message: 'Please enter a valid email'
                    }
                  })}
                  type="email"
                  id="emailOrUsername"
                  placeholder="user@example.com"
                  className="input"
                  aria-label="Email"
                />
                {errors.emailOrUsername && (
                  <p className="mt-1 text-sm text-red-500">{errors.emailOrUsername.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium form-label mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="input pr-10"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Show Password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
                  aria-label="Show Password"
                />
                <label htmlFor="showPassword" className="ml-2 block text-sm text-primary-contrast">
                  Show Password
                </label>
              </div>

              {isLoading && (
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Need an account?{' '}
                  <Link to="/register" className="text-blue-600 hover:text-blue-500 transition-colors">
                    Register
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-700 px-6 py-4 text-center">
        <p className="text-gray-500 text-sm">Copyright © 2025</p>
      </footer>
    </div>
  )
}

export default LoginPage