import { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  Search,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  is_email_verified: boolean;
  created_at: string;
  win_rate?: number;
  total_trades?: number;
  total_profit?: number;
  risk_score?: number;
}

interface Analytics {
  users: {
    total_users: number;
    active_users: number;
    verified_users: number;
  };
  trades: {
    total_trades: number;
    profitable_trades: number;
    total_volume: number;
    total_profit: number;
  };
  alerts: {
    total_alerts: number;
    active_alerts: number;
    triggered_alerts: number;
  };
  onboarding: {
    total_sessions: number;
    completed_sessions: number;
    avg_completion_time: number;
  };
  topPerformers: any[];
  recentActivity: any[];
}

const AdminPage = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // Fetch users list
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery(
    ['adminUsers', currentPage, searchFilter, sortField, sortOrder],
    async () => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
        sort: sortField,
        order: sortOrder,
        ...(searchFilter && { filter: searchFilter })
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/users?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return response.json();
    },
    {
      refetchInterval: 30000,
      staleTime: 15000
    }
  );

  // Fetch analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery(
    'adminAnalytics',
    async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/analytics`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return response.json();
    },
    {
      refetchInterval: 60000,
      staleTime: 30000
    }
  );

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === usersData?.users?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersData?.users?.map((user: User) => user.id) || []);
    }
  };

  const handleBulkRiskUpdate = async (riskSettings: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/users/bulk-risk-update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userIds: selectedUsers,
            riskSettings
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update risk settings');
      }

      const result = await response.json();
      toast.success(result.message);
      setSelectedUsers([]);
      setShowBulkUpdate(false);
      refetchUsers();

    } catch (error) {
      toast.error('Failed to update risk settings');
    }
  };

  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/export/users?format=${format}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success(`Data exported as ${format.toUpperCase()}`);

    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const analytics: Analytics = analyticsData?.analytics;

  if (usersLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users, risk settings, and platform analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExportData('csv')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExportData('json')}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{analytics.users.total_users}</p>
                <p className="text-green-400 text-sm">
                  {analytics.users.verified_users} verified
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Trades</p>
                <p className="text-2xl font-bold text-white">{analytics.trades.total_trades}</p>
                <p className="text-green-400 text-sm">
                  {analytics.trades.profitable_trades} profitable
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Alerts</p>
                <p className="text-2xl font-bold text-white">{analytics.alerts.active_alerts}</p>
                <p className="text-yellow-400 text-sm">
                  {analytics.alerts.triggered_alerts} triggered
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Onboarding Rate</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.onboarding.total_sessions > 0 
                    ? Math.round((analytics.onboarding.completed_sessions / analytics.onboarding.total_sessions) * 100)
                    : 0}%
                </p>
                <p className="text-blue-400 text-sm">
                  {analytics.onboarding.completed_sessions} completed
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>
        </div>
      )}

      {/* User Management */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">User Management</h2>
            {selectedUsers.length > 0 && (
              <button
                onClick={() => setShowBulkUpdate(true)}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Bulk Update ({selectedUsers.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by email, username, or name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            
            <select
              value={`${sortField}:${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split(':');
                setSortField(field);
                setSortOrder(order);
              }}
              className="bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="created_at:desc">Newest First</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="email:asc">Email A-Z</option>
              <option value="email:desc">Email Z-A</option>
              <option value="total_trades:desc">Most Trades</option>
              <option value="total_profit:desc">Highest Profit</option>
              <option value="win_rate:desc">Highest Win Rate</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === usersData?.users?.length && usersData?.users?.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Trades
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {usersData?.users?.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user.total_trades || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user.win_rate ? `${user.win_rate.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`${
                      (user.total_profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${(user.total_profit || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.risk_score ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.risk_score < 3 
                          ? 'bg-green-600 text-white' 
                          : user.risk_score < 7
                          ? 'bg-yellow-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {user.risk_score.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {user.is_email_verified ? (
                        <span className="flex items-center text-green-400">
                          <Shield className="w-4 h-4 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-yellow-400">Unverified</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersData?.pagination && (
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing page {usersData.pagination.page} of {usersData.pagination.totalPages}
              ({usersData.pagination.total} total users)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(usersData.pagination.totalPages, currentPage + 1))}
                disabled={currentPage >= usersData.pagination.totalPages}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <BulkUpdateModal
          userCount={selectedUsers.length}
          onUpdate={handleBulkRiskUpdate}
          onClose={() => setShowBulkUpdate(false)}
        />
      )}
    </div>
  );
};

// Bulk Update Modal Component
interface BulkUpdateModalProps {
  userCount: number;
  onUpdate: (settings: any) => void;
  onClose: () => void;
}

const BulkUpdateModal = ({ userCount, onUpdate, onClose }: BulkUpdateModalProps) => {
  const [maxLeverage, setMaxLeverage] = useState<number | undefined>();
  const [maxDrawdown, setMaxDrawdown] = useState<number | undefined>();
  const [riskTolerance, setRiskTolerance] = useState<string | undefined>();

  const handleSubmit = () => {
    const settings: any = {};
    if (maxLeverage !== undefined) settings.maxLeverage = maxLeverage;
    if (maxDrawdown !== undefined) settings.maxDrawdown = maxDrawdown;
    if (riskTolerance !== undefined) settings.riskTolerance = riskTolerance;

    onUpdate(settings);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
      >
        <h3 className="text-white text-lg font-semibold mb-4">
          Bulk Update Risk Settings
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Update risk settings for {userCount} selected users. Leave fields empty to keep current values.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Max Leverage (1-500x)
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={maxLeverage || ''}
              onChange={(e) => setMaxLeverage(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Max Drawdown (1-50%)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              step="0.1"
              value={maxDrawdown || ''}
              onChange={(e) => setMaxDrawdown(e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Risk Tolerance
            </label>
            <select
              value={riskTolerance || ''}
              onChange={(e) => setRiskTolerance(e.target.value || undefined)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="">Keep current</option>
              <option value="low">Conservative</option>
              <option value="medium">Moderate</option>
              <option value="high">Aggressive</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Update Settings
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminPage;