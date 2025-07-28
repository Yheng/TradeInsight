import { useState } from 'react'
import { useQuery } from 'react-query'
import { Brain, TrendingUp, AlertTriangle, Target } from 'lucide-react'
import ApiService from '@/services/apiService'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const AnalyticsPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD')

  const { data: aiAnalysis, isLoading: aiLoading } = useQuery(
    ['aiAnalysis', selectedSymbol],
    () => ApiService.getAIAnalysis(selectedSymbol),
    { enabled: !!selectedSymbol }
  )

  const { data: riskMetrics, isLoading: riskLoading } = useQuery(
    'riskMetrics',
    ApiService.getRiskMetrics
  )

  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    'performanceData',
    () => ApiService.getPerformanceData('30d')
  )

  const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD']

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-success-600 bg-success-100'
      case 'MEDIUM':
        return 'text-warning-600 bg-warning-100'
      case 'HIGH':
        return 'text-danger-600 bg-danger-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return 'text-success-600 bg-success-100'
      case 'SELL':
        return 'text-danger-600 bg-danger-100'
      case 'HOLD':
        return 'text-warning-600 bg-warning-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">AI-powered trading insights and risk analysis</p>
      </div>

      {/* Symbol Selection */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Select Symbol for AI Analysis</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {symbols.map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedSymbol === symbol
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Brain className="w-5 h-5 text-primary-600 mr-2" />
              <h3 className="card-title">AI Analysis - {selectedSymbol}</h3>
            </div>
          </div>
          <div className="card-content">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Recommendation</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(
                      aiAnalysis.recommendation
                    )}`}
                  >
                    {aiAnalysis.recommendation}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Confidence</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${aiAnalysis.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {(aiAnalysis.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Risk Level</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(
                      aiAnalysis.riskLevel
                    )}`}
                  >
                    {aiAnalysis.riskLevel}
                  </span>
                </div>
                
                {aiAnalysis.targetPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Target Price</span>
                    <span className="text-sm font-medium text-gray-900">
                      {aiAnalysis.targetPrice.toFixed(5)}
                    </span>
                  </div>
                )}
                
                {aiAnalysis.stopLoss && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Stop Loss</span>
                    <span className="text-sm font-medium text-gray-900">
                      {aiAnalysis.stopLoss.toFixed(5)}
                    </span>
                  </div>
                )}
                
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reasoning:</span> {aiAnalysis.reasoning}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No AI analysis available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Analysis will be generated when market data is available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-warning-600 mr-2" />
              <h3 className="card-title">Risk Analysis</h3>
            </div>
          </div>
          <div className="card-content">
            {riskLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : riskMetrics ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{riskMetrics.riskScore}</div>
                  <div className="text-sm text-gray-600">Risk Score (0-100)</div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          riskMetrics.riskScore <= 30
                            ? 'bg-success-600'
                            : riskMetrics.riskScore <= 60
                            ? 'bg-warning-600'
                            : 'bg-danger-600'
                        }`}
                        style={{ width: `${riskMetrics.riskScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {riskMetrics.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {riskMetrics.sharpeRatio.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Sharpe Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(riskMetrics.maxDrawdown)}
                    </div>
                    <div className="text-xs text-gray-600">Max Drawdown</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {riskMetrics.profitFactor.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Profit Factor</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No risk data available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Complete some trades to see risk analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-success-600 mr-2" />
            <h3 className="card-title">Performance Analysis (30 Days)</h3>
          </div>
        </div>
        <div className="card-content">
          {performanceLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : performanceData && performanceData.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {performanceData.reduce((sum: number, day: any) => sum + day.trades_count, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      performanceData.reduce((sum: number, day: any) => sum + day.daily_profit, 0)
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Total P&L</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {performanceData.filter((day: any) => day.daily_profit > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Profitable Days</div>
                </div>
              </div>
              
              <div className="space-y-2">
                {performanceData.slice(-10).map((day: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">{day.date}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">{day.trades_count} trades</span>
                      <span
                        className={`text-sm font-medium ${
                          day.daily_profit >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}
                      >
                        {formatCurrency(day.daily_profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start trading to see your performance analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage