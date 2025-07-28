import { useState, useEffect } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  deferredPrompt: PWAInstallPrompt | null;
}

export const usePWA = () => {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    deferredPrompt: null
  });

  useEffect(() => {
    // Check if app is installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone ||
                       document.referrer.includes('android-app://');
    
    setPWAState(prev => ({ ...prev, isInstalled }));

    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const deferredPrompt = e as any;
      setPWAState(prev => ({
        ...prev,
        isInstallable: true,
        deferredPrompt
      }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setPWAState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null
      }));
    };

    // Listen for online/offline status
    const handleOnline = () => {
      setPWAState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPWAState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('SW registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setPWAState(prev => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        }
      });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error('SW registration failed:', error);
    }
  };

  const installApp = async (): Promise<boolean> => {
    if (!pwaState.deferredPrompt) {
      return false;
    }

    try {
      await pwaState.deferredPrompt.prompt();
      const choiceResult = await pwaState.deferredPrompt.userChoice;
      
      setPWAState(prev => ({
        ...prev,
        deferredPrompt: null,
        isInstallable: false
      }));

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Failed to install app:', error);
      return false;
    }
  };

  const updateApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.ready;
      return registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    }
  };

  return {
    ...pwaState,
    installApp,
    updateApp,
    requestNotificationPermission,
    showNotification
  };
};