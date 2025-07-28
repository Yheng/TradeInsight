import { Menu, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import AlertStatus from '@/components/alerts/AlertStatus'

const Header = () => {
  const { user } = useAuthStore()

  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700">
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Page title */}
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white">
            Trading Dashboard
          </h1>
        </div>
        
        {/* Right side - alerts and user menu */}
        <div className="flex items-center space-x-4">
          {/* Real-time Alerts */}
          <AlertStatus />
          
          {/* User avatar */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              {user?.email ? (
                <span className="text-sm font-medium text-white">
                  {user.email[0].toUpperCase()}
                </span>
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="text-sm text-gray-300">
              {user?.email || 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header