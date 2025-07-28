import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';

interface Alert {
  id: string;
  userId: string;
  type: 'risk_warning' | 'drawdown_violation' | 'volatility_spike' | 'leverage_warning' | 'test';
  symbol?: string;
  message: string;
  value: number;
  threshold: number;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface AlertsContextType {
  alerts: Alert[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscribe: () => void;
  unsubscribe: () => void;
  testAlert: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};

interface AlertsProviderProps {
  children: ReactNode;
}

export const AlertsProvider = ({ children }: AlertsProviderProps) => {
  const { user } = useAuthStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const subscribe = () => {
    if (!user || eventSource) return;

    setConnectionStatus('connecting');
    
    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionStatus('error');
      return;
    }

    const es = new EventSource(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/alerts/subscribe`,
      {
        withCredentials: false
      }
    );

    // Set authorization header using custom approach since EventSource doesn't support custom headers
    // We'll need to handle auth via query params or implement a different approach
    
    es.onopen = () => {
      console.log('Alert subscription opened');
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received alert message:', data);

        switch (data.type) {
          case 'connected':
            console.log('Connected to alerts:', data.data);
            break;
            
          case 'alert':
            handleNewAlert(data.data);
            break;
            
          case 'heartbeat':
            console.log('Heartbeat received');
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing alert message:', error);
      }
    };

    es.onerror = (error) => {
      console.error('Alert subscription error:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (user) {
          subscribe();
        }
      }, 5000);
    };

    setEventSource(es);
  };

  const unsubscribe = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const handleNewAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts

    // Show toast notification based on priority
    const alertMessage = `${alert.symbol ? `[${alert.symbol}] ` : ''}${alert.message}`;
    
    switch (alert.priority) {
      case 'high':
        toast.error(alertMessage, {
          autoClose: 10000,
          className: 'bg-red-600 text-white'
        });
        break;
      case 'medium':
        toast.warn(alertMessage, {
          autoClose: 7000,
          className: 'bg-yellow-600 text-white'
        });
        break;
      case 'low':
        toast.info(alertMessage, {
          autoClose: 5000,
          className: 'bg-blue-600 text-white'
        });
        break;
    }

    // Play alert sound for high priority alerts
    if (alert.priority === 'high') {
      try {
        const audio = new Audio('/alert-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Audio play failed (user hasn't interacted with page yet)
        });
      } catch (error) {
        // Audio not available
      }
    }
  };

  const testAlert = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/alerts/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send test alert');
      }

      toast.success('Test alert sent!');
    } catch (error) {
      console.error('Error sending test alert:', error);
      toast.error('Failed to send test alert');
    }
  };

  // Auto-subscribe when user logs in
  useEffect(() => {
    if (user && !eventSource) {
      subscribe();
    } else if (!user && eventSource) {
      unsubscribe();
    }

    return () => {
      if (eventSource) {
        unsubscribe();
      }
    };
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const contextValue: AlertsContextType = {
    alerts,
    isConnected,
    connectionStatus,
    subscribe,
    unsubscribe,
    testAlert
  };

  return (
    <AlertsContext.Provider value={contextValue}>
      {children}
    </AlertsContext.Provider>
  );
};