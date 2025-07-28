import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNavigation from '../mobile/MobileNavigation'
import MobileHeader from '../mobile/MobileHeader'
import PWAInstallPrompt from './PWAInstallPrompt'
import OfflineIndicator from './OfflineIndicator'

const Layout = () => {
  const location = useLocation()
  
  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/trading') return 'Trading'
    if (path === '/charts') return 'Charts'
    if (path === '/analytics') return 'Analytics'
    if (path === '/alerts') return 'Alerts'
    if (path === '/social') return 'Social'
    if (path === '/profile') return 'Profile'
    if (path === '/admin') return 'Admin'
    return 'TradeInsight'
  }

  return (
    <div className="flex h-screen bg-dark-900 gradient-trading-bg">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <Header />
        
        {/* Mobile Header */}
        <MobileHeader title={getPageTitle()} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 md:p-6 scroll-smooth pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}

export default Layout