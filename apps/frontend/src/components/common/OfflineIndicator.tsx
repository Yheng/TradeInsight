import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white px-4 py-2 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            You're offline. Some features may be limited.
          </span>
        </div>
        
        <button
          onClick={handleRetry}
          className="flex items-center space-x-1 px-3 py-1 bg-yellow-700 hover:bg-yellow-800 rounded text-sm transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
};

export default OfflineIndicator;