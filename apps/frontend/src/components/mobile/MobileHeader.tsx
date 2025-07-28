import React, { useState } from 'react';
import { Menu, X, Bell, Settings, Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useAuthStore } from '@/stores/authStore';

interface MobileHeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onMenuToggle }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuthStore();
  const { isOnline, isInstallable, installApp } = usePWA();

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
    onMenuToggle?.();
  };

  const handleInstallApp = async () => {
    const installed = await installApp();
    if (installed) {
      setShowMenu(false);
    }
  };

  return (
    <>
      <header className="bg-dark-800 border-b border-dark-700 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleMenuToggle}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-700 transition-colors"
            >
              {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold text-gray-100 truncate">{title}</h1>
          </div>

          <div className="flex items-center space-x-2">
            {/* Online/Offline Indicator */}
            <div className={`p-1 rounded ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setShowMenu(false)}>
          <div className="absolute top-0 left-0 w-80 max-w-[90vw] h-full bg-dark-800 shadow-xl">
            <div className="p-6">
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-dark-700">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white text-lg font-medium">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-gray-100 font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                {isInstallable && (
                  <button
                    onClick={handleInstallApp}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-dark-700 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Install App</span>
                  </button>
                )}

                <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-dark-700 transition-colors">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* App Info */}
              <div className="mt-auto pt-6 border-t border-dark-700">
                <div className="text-xs text-gray-500">
                  <p>TradeInsight v1.0.0</p>
                  <p className="mt-1">
                    Status: <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;