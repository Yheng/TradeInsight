import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const PWAInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { isInstallable, installApp } = usePWA();

  if (!isInstallable || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if user previously dismissed
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null; // Don't show for 7 days after dismissal
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-96 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 animate-slide-up">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-100">
              Install TradeInsight
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Get the full app experience with offline access, push notifications, and faster loading.
            </p>
            
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center space-x-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-gray-400 hover:text-gray-200 text-xs transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;