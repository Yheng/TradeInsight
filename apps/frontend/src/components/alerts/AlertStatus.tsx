import { useState } from 'react';
import { Bell, BellOff, Wifi, WifiOff, TestTube, Activity } from 'lucide-react';
import { useAlerts } from './AlertsProvider';
import { motion, AnimatePresence } from 'framer-motion';

const AlertStatus = () => {
  const { isConnected, connectionStatus, subscribe, unsubscribe, testAlert, alerts } = useAlerts();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
        return 'text-yellow-400';
      case 'disconnected':
        return 'text-gray-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const recentAlerts = alerts.slice(0, 3);

  return (
    <div className="relative">
      {/* Alert Status Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors"
        aria-label={`Alert system status: ${getStatusText()}. ${alerts.length} alerts.`}
        aria-expanded={showDetails}
        aria-haspopup="true"
      >
        {isConnected ? (
          <Bell className="w-4 h-4 text-blue-400" aria-hidden="true" />
        ) : (
          <BellOff className="w-4 h-4 text-gray-400" aria-hidden="true" />
        )}
        
        <span aria-hidden="true">{getStatusIcon()}</span>
        
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        
        {alerts.length > 0 && (
          <span 
            className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            aria-label={`${alerts.length} unread alerts`}
          >
            {alerts.length > 99 ? '99+' : alerts.length}
          </span>
        )}
      </button>

      {/* Alert Details Dropdown */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Alert System</h3>
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span className={`text-sm ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </div>
              </div>

              {/* Connection Controls */}
              <div className="flex space-x-2 mb-4">
                {!isConnected ? (
                  <button
                    onClick={subscribe}
                    disabled={connectionStatus === 'connecting'}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm py-2 px-3 rounded-md transition-colors"
                    aria-label="Connect to real-time alerts"
                  >
                    Connect to Alerts
                  </button>
                ) : (
                  <button
                    onClick={unsubscribe}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-md transition-colors"
                    aria-label="Disconnect from alerts"
                  >
                    Disconnect
                  </button>
                )}
                
                <button
                  onClick={testAlert}
                  disabled={!isConnected}
                  className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white text-sm py-2 px-3 rounded-md transition-colors"
                  aria-label="Send test alert"
                >
                  <TestTube className="w-4 h-4" aria-hidden="true" />
                  <span>Test</span>
                </button>
              </div>

              {/* Recent Alerts */}
              <div>
                <h4 className="text-gray-400 text-sm font-medium mb-2">
                  Recent Alerts ({alerts.length})
                </h4>
                
                {recentAlerts.length > 0 ? (
                  <div 
                    className="space-y-2 max-h-40 overflow-y-auto"
                    role="list"
                    aria-label="Recent trading alerts"
                  >
                    {recentAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-2 rounded-md border-l-4 ${
                          alert.priority === 'high'
                            ? 'bg-red-900 bg-opacity-20 border-red-500'
                            : alert.priority === 'medium'
                            ? 'bg-yellow-900 bg-opacity-20 border-yellow-500'
                            : 'bg-blue-900 bg-opacity-20 border-blue-500'
                        }`}
                        role="listitem"
                        aria-label={`${alert.priority} priority alert for ${alert.symbol || 'trading'}: ${alert.message}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {alert.symbol && (
                              <span className="text-xs font-mono text-gray-400 bg-gray-700 px-1 rounded">
                                {alert.symbol}
                              </span>
                            )}
                            <p className="text-white text-sm mt-1">{alert.message}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              <time dateTime={alert.timestamp}>
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </time>
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              alert.priority === 'high'
                                ? 'bg-red-600 text-white'
                                : alert.priority === 'medium'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                            aria-label={`Priority: ${alert.priority}`}
                          >
                            {alert.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-gray-400 text-sm">No alerts yet</p>
                    <p className="text-gray-500 text-xs">
                      You'll see real-time trading alerts here
                    </p>
                  </div>
                )}
              </div>

              {/* Connection Info */}
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={getStatusColor()}>{getStatusText()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Alerts:</span>
                    <span className="text-white">{alerts.length}</span>
                  </div>
                  {isConnected && (
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <span className="text-green-400">Live</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertStatus;