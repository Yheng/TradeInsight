import { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Users, 
  Trophy, 
  Eye,
  EyeOff,
  Award,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface CommunityMetrics {
  topPerformers: any[];
  volumeDistribution: any[];
  popularSymbols: any[];
  riskDistribution: any[];
  sentiment: {
    bullishPercentage: number;
    communityWinRate: number;
    totalActiveTraders: number;
    totalCommunityTrades: number;
  };
  timeframe: string;
  updatedAt: string;
}

interface SharingPreferences {
  shareMetrics: boolean;
  shareWinRate: boolean;
  shareVolume: boolean;
  shareRiskScore: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
}

const SocialPage = () => {
  const [activeTab, setActiveTab] = useState<'community' | 'leaderboard' | 'badges' | 'settings'>('community');
  const [timeframe, setTimeframe] = useState('7d');
  const [leaderboardCategory, setLeaderboardCategory] = useState('win_rate');
  const [showSharingModal, setShowSharingModal] = useState(false);

  // Fetch community metrics
  const { data: communityData, isLoading: communityLoading } = useQuery(
    ['communityMetrics', timeframe],
    async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/social/community/metrics?timeframe=${timeframe}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch community metrics');
      }

      return response.json();
    },
    {
      refetchInterval: 60000, // Refresh every minute
      staleTime: 30000
    }
  );

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(
    ['leaderboard', leaderboardCategory, timeframe],
    async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/social/leaderboard?category=${leaderboardCategory}&timeframe=${timeframe}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return response.json();
    },
    {
      refetchInterval: 60000,
      staleTime: 30000,
      enabled: activeTab === 'leaderboard'
    }
  );

  // Fetch user badges
  const { data: badgesData, isLoading: badgesLoading } = useQuery(
    'userBadges',
    async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/social/badges`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      return response.json();
    },
    {
      enabled: activeTab === 'badges'
    }
  );

  // Fetch sharing preferences
  const { data: preferencesData, isLoading: preferencesLoading, refetch: refetchPreferences } = useQuery(
    'sharingPreferences',
    async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/social/sharing/preferences`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sharing preferences');
      }

      return response.json();
    },
    {
      enabled: activeTab === 'settings'
    }
  );

  const community: CommunityMetrics = communityData?.data;
  const leaderboard = leaderboardData?.data?.leaderboard || [];
  const badges: Badge[] = badgesData?.data?.badges || [];
  const preferences: SharingPreferences = preferencesData?.data || {
    shareMetrics: false,
    shareWinRate: false,
    shareVolume: false,
    shareRiskScore: false
  };

  const handleUpdateSharingPreferences = async (newPreferences: SharingPreferences) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/social/sharing/preferences`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newPreferences)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update sharing preferences');
      }

      toast.success('Sharing preferences updated successfully');
      refetchPreferences();
      setShowSharingModal(false);

    } catch (error) {
      toast.error('Failed to update sharing preferences');
    }
  };

  const getBadgeColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      case 'bronze': return 'bg-orange-600';
      default: return 'bg-gray-500';
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-white';
  };

  if (communityLoading && activeTab === 'community') {
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
          <h1 className="text-3xl font-bold text-white mb-2">Social Trading</h1>
          <p className="text-gray-400">Connect with the trading community and share insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'community', label: 'Community', icon: Users },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'badges', label: 'Badges', icon: Award },
          { id: 'settings', label: 'Privacy', icon: Settings }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Community Tab */}
      {activeTab === 'community' && community && (
        <div className="space-y-6">
          {/* Community Sentiment */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Community Sentiment</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {community.sentiment.bullishPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Bullish Traders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {community.sentiment.communityWinRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Avg Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {community.sentiment.totalActiveTraders}
                </div>
                <div className="text-sm text-gray-400">Active Traders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {community.sentiment.totalCommunityTrades}
                </div>
                <div className="text-sm text-gray-400">Total Trades</div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Top Performers</h2>
            <div className="space-y-3">
              {community.topPerformers.slice(0, 10).map((performer, index) => (
                <motion.div
                  key={performer.anonymous_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${getRankColor(parseInt(performer.rank.replace('rank_', '')))}`}>
                      #{performer.rank.replace('rank_', '')}
                    </div>
                    <div>
                      <div className="font-medium text-white">{performer.anonymous_id}</div>
                      <div className="text-sm text-gray-400">{performer.total_trades} trades</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">
                      {performer.win_rate.toFixed(1)}% Win Rate
                    </div>
                    <div className="text-sm text-gray-400">
                      Status: {performer.status}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Popular Symbols */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Popular Trading Symbols</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {community.popularSymbols.map((symbol) => (
                <div
                  key={symbol.symbol}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-white">{symbol.symbol}</div>
                    <div className="text-sm text-gray-400">{symbol.trade_count} trades</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      symbol.success_rate >= 0.6 ? 'text-green-400' : 
                      symbol.success_rate >= 0.4 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {(symbol.success_rate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">Success Rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
            <select
              value={leaderboardCategory}
              onChange={(e) => setLeaderboardCategory(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="win_rate">Win Rate</option>
              <option value="profit">Total Profit</option>
              <option value="volume">Trading Volume</option>
              <option value="consistency">Consistency</option>
            </select>
          </div>

          {leaderboardLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Trader
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Win Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Trades
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Profit Factor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {leaderboard.map((trader: any) => (
                      <tr 
                        key={trader.anonymous_id} 
                        className={`hover:bg-gray-700 transition-colors ${
                          trader.is_current_user ? 'bg-blue-900/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-lg font-bold ${getRankColor(trader.rank)}`}>
                            #{trader.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-white font-medium">
                              {trader.anonymous_id}
                            </span>
                            {trader.is_current_user && (
                              <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-400 font-semibold">
                          {trader.win_rate.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {trader.total_trades}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-purple-400 font-semibold">
                          {trader.profit_factor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Your Achievements</h2>
          
          {badgesLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center"
                >
                  <div className={`w-16 h-16 ${getBadgeColor(badge.tier)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{badge.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{badge.description}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    badge.tier === 'gold' ? 'bg-yellow-500 text-black' :
                    badge.tier === 'silver' ? 'bg-gray-400 text-black' :
                    'bg-orange-600 text-white'
                  }`}>
                    {badge.tier.toUpperCase()}
                  </span>
                </motion.div>
              ))}
              
              {badges.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Award className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No badges yet</h3>
                  <p className="text-gray-500">Start trading to earn your first achievement!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Privacy Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Privacy Settings</h2>
            <button
              onClick={() => setShowSharingModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Update Preferences
            </button>
          </div>

          {preferencesLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Current Sharing Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Share Trading Metrics</div>
                    <div className="text-gray-400 text-sm">Allow your anonymized performance to appear in community insights</div>
                  </div>
                  <div className={`flex items-center ${preferences.shareMetrics ? 'text-green-400' : 'text-red-400'}`}>
                    {preferences.shareMetrics ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    <span className="ml-2">{preferences.shareMetrics ? 'Public' : 'Private'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Share Win Rate</div>
                    <div className="text-gray-400 text-sm">Include your win rate in community statistics</div>
                  </div>
                  <div className={`flex items-center ${preferences.shareWinRate ? 'text-green-400' : 'text-red-400'}`}>
                    {preferences.shareWinRate ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    <span className="ml-2">{preferences.shareWinRate ? 'Shared' : 'Private'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Share Trading Volume</div>
                    <div className="text-gray-400 text-sm">Include your trading volume in community insights</div>
                  </div>
                  <div className={`flex items-center ${preferences.shareVolume ? 'text-green-400' : 'text-red-400'}`}>
                    {preferences.shareVolume ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    <span className="ml-2">{preferences.shareVolume ? 'Shared' : 'Private'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Share Risk Score</div>
                    <div className="text-gray-400 text-sm">Include your risk profile in community analytics</div>
                  </div>
                  <div className={`flex items-center ${preferences.shareRiskScore ? 'text-green-400' : 'text-red-400'}`}>
                    {preferences.shareRiskScore ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    <span className="ml-2">{preferences.shareRiskScore ? 'Shared' : 'Private'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sharing Preferences Modal */}
      {showSharingModal && (
        <SharingModal
          preferences={preferences}
          onUpdate={handleUpdateSharingPreferences}
          onClose={() => setShowSharingModal(false)}
        />
      )}
    </div>
  );
};

// Sharing Preferences Modal Component
interface SharingModalProps {
  preferences: SharingPreferences;
  onUpdate: (preferences: SharingPreferences) => void;
  onClose: () => void;
}

const SharingModal = ({ preferences, onUpdate, onClose }: SharingModalProps) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSubmit = () => {
    onUpdate(localPreferences);
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
          Update Sharing Preferences
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Control what trading data you share with the community. All shared data is anonymized.
        </p>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-white">Share Trading Metrics</span>
            <input
              type="checkbox"
              checked={localPreferences.shareMetrics}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, shareMetrics: e.target.checked }))}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-white">Share Win Rate</span>
            <input
              type="checkbox"
              checked={localPreferences.shareWinRate}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, shareWinRate: e.target.checked }))}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-white">Share Trading Volume</span>
            <input
              type="checkbox"
              checked={localPreferences.shareVolume}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, shareVolume: e.target.checked }))}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-white">Share Risk Score</span>
            <input
              type="checkbox"
              checked={localPreferences.shareRiskScore}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, shareRiskScore: e.target.checked }))}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-600"
            />
          </label>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Update Preferences
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

export default SocialPage;