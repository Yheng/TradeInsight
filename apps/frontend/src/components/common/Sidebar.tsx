import { NavLink, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  TrendingUp, 
  Bell, 
  User, 
  LogOut,
  LayoutDashboard,
  Activity,
  Shield,
  Users,
  LineChart
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { clsx } from 'clsx'

const getNavigation = (userRole?: string, t?: any) => {
  const baseNavigation = [
    { name: t?.('navigation.dashboard') || 'Dashboard', href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { name: t?.('navigation.trading') || 'Trading', href: '/trading', icon: TrendingUp, key: 'trading' },
    { name: t?.('navigation.charts') || 'Charts', href: '/charts', icon: LineChart, key: 'charts' },
    { name: t?.('navigation.analytics') || 'Analytics', href: '/analytics', icon: BarChart3, key: 'analytics' },
    { name: t?.('navigation.alerts') || 'Alerts', href: '/alerts', icon: Bell, key: 'alerts' },
    { name: t?.('navigation.social') || 'Social', href: '/social', icon: Users, key: 'social' },
    { name: t?.('navigation.profile') || 'Profile', href: '/profile', icon: User, key: 'profile' },
  ];

  if (userRole === 'admin') {
    baseNavigation.push({
      name: t?.('navigation.admin') || 'Admin', 
      href: '/admin', 
      icon: Shield,
      key: 'admin'
    });
  }

  return baseNavigation;
};

const Sidebar = () => {
  const location = useLocation()
  const { logout, user } = useAuthStore()
  const { t } = useTranslation()
  const navigation = getNavigation(user?.role, t)

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gray-800 border-r border-gray-700">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4">
          <Activity className="w-8 h-8 text-blue-400" aria-hidden="true" />
          <span className="ml-2 text-xl font-bold text-white">TradeInsight</span>
        </div>
        
        {/* Navigation */}
        <nav className="mt-8 flex-grow flex flex-col" aria-label="Main navigation">
          <div className="px-3">
            <ul className="space-y-1" role="list">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={clsx(
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon
                        className={clsx(
                          'mr-3 h-5 w-5 flex-shrink-0',
                          isActive
                            ? 'text-white'
                            : 'text-gray-400 group-hover:text-gray-300'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
        
        {/* User section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div 
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
                role="img"
                aria-label={`User avatar for ${user?.email || 'user'}`}
              >
                <span className="text-sm font-medium text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              {user?.role === 'admin' && (
                <p className="text-xs text-blue-400">Administrator</p>
              )}
            </div>
            <button
              onClick={logout}
              className="ml-3 text-gray-400 hover:text-gray-300 p-1 rounded-md hover:bg-gray-700"
              aria-label={t('navigation.logout')}
              title={t('navigation.logout')}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar