import { useQuery } from 'react-query'
import { TrendingUp, Activity, AlertTriangle, Eye, BarChart3, ArrowUpRight, ArrowDownRight, DollarSign, Target, PieChart, Zap } from 'lucide-react'
import ApiService from '@/services/apiService'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'

const DashboardPage = () => {
  const { user, token } = useAuthStore()
  const isAuthenticated = !!user && !!token

  const { data: tradeStats, isLoading: statsLoading } = useQuery(
    'tradeStats',
    ApiService.getTradeStats,
    { 
      refetchInterval: 30000,
      enabled: isAuthenticated
    }
  )

  const { data: riskMetrics, isLoading: riskLoading } = useQuery(
    'riskMetrics',
    ApiService.getRiskMetrics,
    { 
      refetchInterval: 60000,
      enabled: isAuthenticated
    }
  )

  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    'performanceData',
    () => ApiService.getPerformanceData('7d'),
    { 
      refetchInterval: 300000,
      enabled: isAuthenticated
    }
  )

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Please Log In</h2>
          <p className="text-gray-500">You need to be logged in to view the dashboard.</p>
        </div>
      </div>
    )
  }

  if (statsLoading || riskLoading || performanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Provide default values if data is not loaded

  const safeRiskMetrics = {
    sharpeRatio: Number(riskMetrics?.sharpeRatio) || 0,
    maxDrawdown: Number(riskMetrics?.maxDrawdown) || 0,
    riskScore: Number(riskMetrics?.riskScore) || 0,
    winRate: Number(riskMetrics?.winRate) || 0,
    profitFactor: Number(riskMetrics?.profitFactor) || 0,
    totalExposure: Number(riskMetrics?.totalExposure) || 0,
    averageWin: Number(riskMetrics?.averageWin) || 0,
    averageLoss: Number(riskMetrics?.averageLoss) || 0
  };

  const safePerformanceData = performanceData || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercentage = (value: number | undefined) => {
    return `${(value || 0).toFixed(2)}%`
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Page Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
        <div className="card-glass border-trading p-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary-600 bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-8 w-8 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-100 tracking-tight">Trading Dashboard</h1>
                  <p className="text-gray-400 text-lg">Welcome back! Monitor your portfolio in real-time</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-3 px-4 py-2 bg-dark-800 bg-opacity-50 rounded-xl border border-dark-600">
                <div className="relative">
                  <div className="w-3 h-3 bg-bullish-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-bullish-500 rounded-full animate-ping opacity-30"></div>
                </div>
                <div>
                  <span className="text-sm font-medium text-bullish-400">Market Open</span>
                  <p className="text-xs text-gray-500">NYSE • NASDAQ</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Last Update</p>
                <p className="text-sm font-mono text-gray-300">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="card-trading p-6 h-full border-primary-500 border-opacity-20 hover:border-opacity-40 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary-500 bg-opacity-10 rounded-xl group-hover:bg-opacity-20 transition-all duration-300">
                <Activity className="h-7 w-7 text-primary-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex items-center space-x-1 text-xs font-medium text-primary-400 bg-primary-500 bg-opacity-10 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Trades</p>
              <p className="text-3xl font-bold text-gray-100 ticker-text tracking-tight">
                {tradeStats?.total_trades || 0}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <div className="flex-1 bg-dark-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-primary-400 h-full rounded-full transition-all duration-700 ease-out" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs font-medium text-gray-400">75%</span>
            </div>
          </div>
        </div>

        <div className={`group relative overflow-hidden ${(tradeStats?.net_profit || 0) >= 0 ? 'hover:border-bullish-500' : 'hover:border-bearish-500'} transition-colors duration-300`}>
          <div className={`absolute inset-0 ${(tradeStats?.net_profit || 0) >= 0 ? 'bg-gradient-bullish' : 'bg-gradient-bearish'} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
          <div className="card-trading p-6 h-full">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 ${(tradeStats?.net_profit || 0) >= 0 ? 'bg-bullish-500' : 'bg-bearish-500'} bg-opacity-10 rounded-xl group-hover:bg-opacity-20 transition-all duration-300`}>
                <DollarSign className={`h-7 w-7 ${(tradeStats?.net_profit || 0) >= 0 ? 'text-bullish-400' : 'text-bearish-400'} group-hover:scale-110 transition-transform duration-300`} />
              </div>
              <div className={`flex items-center space-x-1 text-xs font-bold ${(tradeStats?.net_profit || 0) >= 0 ? 'text-bullish-400 bg-bullish-500' : 'text-bearish-400 bg-bearish-500'} bg-opacity-10 px-3 py-1.5 rounded-full`}>
                {(tradeStats?.net_profit || 0) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{(tradeStats?.net_profit || 0) >= 0 ? '+' : ''}{((tradeStats?.net_profit || 0) / 10000 * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Net Profit</p>
              <p className={`text-3xl font-bold ticker-text tracking-tight ${(tradeStats?.net_profit || 0) >= 0 ? 'text-bullish-400' : 'text-bearish-400'}`}>
                {formatCurrency(tradeStats?.net_profit || 0)}
              </p>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <div className="mt-4">
              <div className={`h-1 rounded-full ${(tradeStats?.net_profit || 0) >= 0 ? 'bg-bullish-500' : 'bg-bearish-500'} opacity-20`}></div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-warning-500 to-warning-600 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="card-trading p-6 h-full border-warning-500 border-opacity-20 hover:border-opacity-40 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-warning-500 bg-opacity-10 rounded-xl group-hover:bg-opacity-20 transition-all duration-300">
                <Target className="h-7 w-7 text-warning-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex items-center space-x-1 text-xs font-medium text-warning-400 bg-warning-500 bg-opacity-10 px-2 py-1 rounded-full">
                <Eye className="h-3 w-3" />
                <span>Live</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Win Rate</p>
              <p className="text-3xl font-bold text-warning-400 ticker-text tracking-tight">
                {formatPercentage(tradeStats?.win_rate || 0)}
              </p>
              <p className="text-xs text-gray-500">Success ratio</p>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{tradeStats?.win_rate || 0}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-warning-500 to-warning-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${tradeStats?.win_rate || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-bearish opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
          <div className="card-trading p-6 h-full border-bearish-500 border-opacity-20 hover:border-opacity-40 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-bearish-500 bg-opacity-10 rounded-xl group-hover:bg-opacity-20 transition-all duration-300">
                <AlertTriangle className="h-7 w-7 text-bearish-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex items-center space-x-1 text-xs font-medium text-bearish-400 bg-bearish-500 bg-opacity-10 px-2 py-1 rounded-full">
                <Zap className="h-3 w-3 animate-pulse" />
                <span>Alert</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Risk Score</p>
              <p className="text-3xl font-bold text-bearish-400 ticker-text tracking-tight">
                {riskMetrics?.riskScore || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">Current level</p>
            </div>
            <div className="mt-4 flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-bearish-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-bearish-400">High Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Performance Chart and Risk Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Premium Performance Chart */}
        <div className="xl:col-span-2">
          <div className="card-glass border-trading hover:border-primary-500 hover:border-opacity-40 transition-all duration-300 group">
            <div className="p-6 border-b border-dark-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-bullish-500 bg-opacity-10 rounded-xl group-hover:bg-opacity-20 transition-all duration-300">
                    <PieChart className="h-6 w-6 text-bullish-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-100">Weekly Performance</h3>
                    <p className="text-sm text-gray-400">Real-time trading analytics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-dark-800 bg-opacity-50 rounded-lg border border-dark-600">
                    <div className="w-2 h-2 bg-bullish-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-bullish-400">Live Data</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Updates every</p>
                    <p className="text-xs font-mono text-gray-400">30s</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {safePerformanceData && safePerformanceData.length > 0 ? (
                <div className="space-y-6">
                  {/* Performance Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-dark-800 bg-opacity-30 rounded-xl border border-dark-700">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total P&L</p>
                      <p className="text-lg font-bold text-gray-100 ticker-text">
                        {formatCurrency(safePerformanceData.reduce((sum: number, day: any) => sum + (day.daily_profit || 0), 0))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Daily</p>
                      <p className="text-lg font-bold text-gray-100 ticker-text">
                        {formatCurrency(safePerformanceData.reduce((sum: number, day: any) => sum + (day.daily_profit || 0), 0) / safePerformanceData.length)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Win Days</p>
                      <p className="text-lg font-bold text-bullish-400 ticker-text">
                        {safePerformanceData.filter((day: any) => day.daily_profit > 0).length}
                      </p>
                    </div>
                  </div>
                  
                  {/* Performance Timeline */}
                  <div className="space-y-3">
                    {safePerformanceData.slice(0, 7).map((day: any, index: number) => {
                      const profitPercentage = Math.abs(day.daily_profit / 1000) * 100; // Normalize for visual
                      return (
                        <div key={index} className="group relative overflow-hidden">
                          <div className={`absolute inset-0 ${day.daily_profit >= 0 ? 'bg-bullish-500' : 'bg-bearish-500'} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                          <div className="relative p-4 rounded-xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center border border-dark-600">
                                    <span className="text-xs font-mono font-bold text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                                  </div>
                                  <div className={`absolute -top-1 -right-1 w-3 h-3 ${day.daily_profit >= 0 ? 'bg-bullish-500' : 'bg-bearish-500'} rounded-full border-2 border-dark-900`}></div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-semibold text-gray-200">{day.date}</span>
                                    <span className="text-xs px-2 py-1 bg-dark-700 text-gray-400 rounded-full">
                                      {day.trades_count} trades
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center space-x-2">
                                    <div className="flex-1 bg-dark-700 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-700 ${day.daily_profit >= 0 ? 'bg-gradient-to-r from-bullish-500 to-bullish-400' : 'bg-gradient-to-r from-bearish-500 to-bearish-400'}`}
                                        style={{ width: `${Math.min(100, profitPercentage)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  {day.daily_profit >= 0 ? 
                                    <ArrowUpRight className="w-4 h-4 text-bullish-400" /> : 
                                    <ArrowDownRight className="w-4 h-4 text-bearish-400" />
                                  }
                                  <span className={`text-lg font-bold ticker-text ${day.daily_profit >= 0 ? 'text-bullish-400' : 'text-bearish-400'}`}>
                                    {day.daily_profit >= 0 ? '+' : ''}{formatCurrency(day.daily_profit)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {((day.daily_profit / 10000) * 100).toFixed(2)}% return
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 bg-gradient-primary opacity-10 rounded-2xl flex items-center justify-center mx-auto">
                      <Activity className="w-10 h-10 text-primary-400" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-glow opacity-20 rounded-2xl"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No performance data available</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">Start trading to see your performance metrics and track your progress over time</p>
                  <button className="mt-6 btn-primary">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Start Trading
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premium Risk Analysis */}
        <div className="xl:col-span-1">
          <div className="card-glass border-trading hover:border-bearish-500 hover:border-opacity-40 transition-all duration-300 group h-full">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-bearish-500 bg-opacity-10 rounded-xl group-hover:bg-opacity-20 transition-all duration-300">
                    <AlertTriangle className="h-6 w-6 text-bearish-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-100">Risk Analysis</h3>
                    <p className="text-sm text-gray-400">Real-time monitoring</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-bearish-400 bg-bearish-500 bg-opacity-10 px-3 py-1.5 rounded-full">
                  <Zap className="h-3 w-3 animate-pulse" />
                  <span>High Risk</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              {riskMetrics ? (
                <div className="space-y-6">
                  {/* Risk Score Circle */}
                  <div className="text-center relative">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-dark-700" />
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="56" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="8" 
                          strokeLinecap="round"
                          className="text-bearish-500"
                          strokeDasharray={`${(safeRiskMetrics.riskScore / 100) * 351.86} 351.86`}
                          style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-bearish-400 ticker-text">{safeRiskMetrics.riskScore}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Risk Score</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-bullish-500 rounded-full"></div>
                        <span className="text-gray-500">Low (0-30)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                        <span className="text-gray-500">Med (31-70)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-bearish-500 rounded-full"></div>
                        <span className="text-gray-500">High (71-100)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-bearish-500 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="relative p-4 bg-dark-800 bg-opacity-50 rounded-xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Max Drawdown</p>
                          <p className="text-lg font-bold text-bearish-400 ticker-text">
                            {formatCurrency(safeRiskMetrics.maxDrawdown)}
                          </p>
                          <div className="mt-2 w-full bg-dark-700 rounded-full h-1">
                            <div className="bg-bearish-500 h-1 rounded-full transition-all duration-700" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary-500 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="relative p-4 bg-dark-800 bg-opacity-50 rounded-xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sharpe Ratio</p>
                          <p className="text-lg font-bold text-gray-100 ticker-text">
                            {safeRiskMetrics.sharpeRatio.toFixed(2)}
                          </p>
                          <div className="mt-2 w-full bg-dark-700 rounded-full h-1">
                            <div className="bg-primary-500 h-1 rounded-full transition-all duration-700" style={{ width: '40%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="space-y-3">
                    <div className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary-500 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-between p-4 bg-dark-800 bg-opacity-50 rounded-xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-primary-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-400">Profit Factor</span>
                        </div>
                        <span className="text-lg font-bold text-gray-100 ticker-text">
                          {safeRiskMetrics.profitFactor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-bullish-500 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-between p-4 bg-dark-800 bg-opacity-50 rounded-xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-bullish-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                            <ArrowUpRight className="w-4 h-4 text-bullish-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-400">Average Win</span>
                        </div>
                        <span className="text-lg font-bold text-bullish-400 ticker-text">
                          {formatCurrency(safeRiskMetrics.averageWin || 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-bearish-500 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-between p-4 bg-dark-800 bg-opacity-50 rounded-xl border border-dark-700 hover:border-dark-600 transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-bearish-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                            <ArrowDownRight className="w-4 h-4 text-bearish-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-400">Average Loss</span>
                        </div>
                        <span className="text-lg font-bold text-bearish-400 ticker-text">
                          {formatCurrency(safeRiskMetrics.averageLoss || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
              </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative mx-auto mb-6">
                      <div className="w-20 h-20 bg-gradient-bearish opacity-10 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-10 h-10 text-bearish-400" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-glow opacity-20 rounded-2xl"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">No risk data available</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">Complete some trades to see detailed risk analysis and monitoring</p>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* Premium Quick Actions Panel */}
      <div className="card-glass border-trading hover:border-primary-500 hover:border-opacity-40 transition-all duration-300 group">
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary-500 bg-opacity-10 rounded-xl group-hover:bg-opacity-20 transition-all duration-300">
                <Zap className="h-6 w-6 text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-100">Quick Actions</h3>
                <p className="text-sm text-gray-400">Execute operations instantly</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-dark-800 bg-opacity-50 rounded-lg border border-dark-600">
              <div className="w-2 h-2 bg-bullish-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-bullish-400">Ready</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="group relative overflow-hidden p-6 bg-gradient-primary opacity-90 hover:opacity-100 rounded-xl border border-primary-500 border-opacity-20 hover:border-opacity-40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative text-center">
                <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">New Trade</h4>
                <p className="text-xs text-white text-opacity-80">Open position</p>
              </div>
            </button>
            
            <button className="group relative overflow-hidden p-6 bg-dark-800 bg-opacity-50 hover:bg-opacity-70 rounded-xl border border-dark-600 hover:border-primary-500 hover:border-opacity-40 transition-all duration-300">
              <div className="absolute inset-0 bg-primary-500 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative text-center">
                <div className="w-12 h-12 bg-primary-500 bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-primary-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-200 mb-1">Analytics</h4>
                <p className="text-xs text-gray-400">View insights</p>
              </div>
            </button>
            
            <button className="group relative overflow-hidden p-6 bg-dark-800 bg-opacity-50 hover:bg-opacity-70 rounded-xl border border-dark-600 hover:border-warning-500 hover:border-opacity-40 transition-all duration-300">
              <div className="absolute inset-0 bg-warning-500 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative text-center">
                <div className="w-12 h-12 bg-warning-500 bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="w-6 h-6 text-warning-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-200 mb-1">Set Alert</h4>
                <p className="text-xs text-gray-400">Price alerts</p>
              </div>
            </button>
          </div>
          
          {/* Enhanced Market Status */}
          <div className="mt-8 p-4 bg-dark-800 bg-opacity-30 rounded-xl border border-dark-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-3 h-3 bg-bullish-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-bullish-500 rounded-full animate-ping opacity-30"></div>
                  </div>
                  <span className="text-sm font-medium text-bullish-400">Markets Open</span>
                </div>
                <div className="text-xs text-gray-500">NYSE • NASDAQ • FOREX</div>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <div>
                  <span className="text-gray-500">Next Close:</span>
                  <span className="ml-1 font-mono">16:00 EST</span>
                </div>
                <div>
                  <span className="text-gray-500">Server:</span>
                  <span className="ml-1 font-mono text-bullish-400">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage