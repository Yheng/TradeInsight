import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Activity, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface RegisterForm {
  email: string
  username: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
}

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('')
      await registerUser({
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-trading-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="glass-effect p-4 rounded-xl">
              <Activity className="w-12 h-12 text-primary-400" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-100">
            Create Trading Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Join TradeInsight and start trading smarter
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="status-online"></div>
            <span className="text-xs text-bullish-400 font-medium">Ready to Trade</span>
          </div>
        </div>

        {/* Enhanced Registration Form */}
        <div className="glass-effect rounded-xl p-8 border border-dark-700">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: { value: 1, message: 'First name is required' },
                    })}
                    type="text"
                    className="input"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-bearish-400">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: { value: 1, message: 'Last name is required' },
                    })}
                    type="text"
                    className="input"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-bearish-400">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="input"
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-bearish-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  {...register('username', {
                    required: 'Username is required',
                    minLength: { value: 3, message: 'Username must be at least 3 characters' },
                    maxLength: { value: 30, message: 'Username must be less than 30 characters' },
                  })}
                  type="text"
                  className="input"
                  placeholder="johndoe"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-bearish-400">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>-])[A-Za-z\d!@#$%^&*(),.?":{}|<>-]+$/,
                        message: 'Password must contain uppercase, lowercase, number and special character',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-bearish-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-bearish-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center relative overflow-hidden"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create Trading Account'
                )}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-dark-700">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
                  Sign In to Platform
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage