import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, TrendingUp, TrendingDown, X, Activity, Search, Filter, DollarSign, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import ApiService from '@/services/apiService'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Trade } from '@tradeinsight/types'

interface NewTradeForm {
  symbol: string
  type: 'buy' | 'sell'
  volume: number
  openPrice: number
  comment?: string
}

interface CloseTradeForm {
  closePrice: number
}

const TradingPage = () => {
  const [showNewTradeModal, setShowNewTradeModal] = useState(false)
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: tradesData, isLoading } = useQuery(
    'trades',
    () => ApiService.getTrades({ limit: 50 }),
    { refetchInterval: 30000 }
  )

  const createTradeMutation = useMutation(ApiService.createTrade, {
    onSuccess: () => {
      queryClient.invalidateQueries('trades')
      queryClient.invalidateQueries('tradeStats')
      setShowNewTradeModal(false)
      newTradeForm.reset()
    },
  })

  const closeTradeMutation = useMutation(
    ({ id, closePrice }: { id: string; closePrice: number }) =>
      ApiService.closeTrade(id, closePrice),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('trades')
        queryClient.invalidateQueries('tradeStats')
        setClosingTradeId(null)
        closeTradeForm.reset()
      },
    }
  )

  const newTradeForm = useForm<NewTradeForm>()
  const closeTradeForm = useForm<CloseTradeForm>()

  const onCreateTrade = async (data: NewTradeForm) => {
    await createTradeMutation.mutateAsync(data)
  }

  const onCloseTrade = async (data: CloseTradeForm) => {
    if (closingTradeId) {
      await closeTradeMutation.mutateAsync({
        id: closingTradeId,
        closePrice: data.closePrice,
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const trades = tradesData?.data || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Page Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
        <div className="card-glass border-trading p-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-600 bg-opacity-20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="h-8 w-8 text-primary-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-100 tracking-tight">Trading Terminal</h1>
                <p className="text-gray-400 text-lg">Manage your positions and execute trades</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3 px-4 py-3 bg-dark-800 bg-opacity-50 rounded-xl border border-dark-600">
                <Activity className="w-5 h-5 text-bullish-400" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Active Trades</p>
                  <p className="text-xs text-gray-500">{trades.filter((t: Trade) => t.status === 'open').length} positions</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTradeModal(true)}
                className="btn-primary px-6 py-3 text-base font-semibold shadow-glow-md hover:shadow-glow-lg transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Trade
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Trading Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trades..."
              className="input pl-10 pr-4 py-2 w-64 bg-dark-800 border-dark-600 focus:border-primary-500"
            />
          </div>
          <button className="btn-secondary px-4 py-2">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>Showing {trades.length} trades</span>
          <div className="w-2 h-2 bg-bullish-500 rounded-full animate-pulse"></div>
          <span className="text-bullish-400">Live updates</span>
        </div>
      </div>

      {/* Premium Trades Table */}
      <div className="card-glass border-trading hover:border-primary-500 hover:border-opacity-40 transition-all duration-300">
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500 bg-opacity-10 rounded-lg">
                <Activity className="h-5 w-5 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-100">Trading Positions</h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-dark-800 bg-opacity-50 rounded-full text-xs font-medium text-gray-400">
                Real-time
              </div>
            </div>
          </div>
        </div>
        <div className="card-content p-0">
          {trades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Close Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit/Loss
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trades.map((trade: Trade) => (
                    <tr key={trade.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trade.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {trade.type === 'buy' ? (
                            <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
                          )}
                          {trade.type.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trade.volume}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trade.openPrice.toFixed(5)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trade.closePrice ? trade.closePrice.toFixed(5) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {trade.profit !== null && trade.profit !== undefined ? (
                          <span
                            className={
                              trade.profit >= 0 ? 'text-success-600' : 'text-danger-600'
                            }
                          >
                            {formatCurrency(trade.profit)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`badge ${
                            trade.status === 'open'
                              ? 'badge-warning'
                              : trade.status === 'closed'
                              ? 'badge-secondary'
                              : 'badge-secondary'
                          }`}
                        >
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(trade.openTime.toString())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {trade.status === 'open' && (
                          <button
                            onClick={() => setClosingTradeId(trade.id)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
              <div className="text-center py-20">
                <div className="relative mx-auto mb-8">
                  <div className="w-24 h-24 bg-gradient-primary opacity-10 rounded-2xl flex items-center justify-center mx-auto">
                    <TrendingUp className="w-12 h-12 text-primary-400" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-glow opacity-20 rounded-2xl"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-3">No trades yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed mb-8">
                  Start your trading journey by opening your first position in the market.
                </p>
                <button
                  onClick={() => setShowNewTradeModal(true)}
                  className="btn-primary px-8 py-3 text-base font-semibold shadow-glow-md"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Trade
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Enhanced New Trade Modal */}
      {showNewTradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <div className="card-glass border-trading shadow-2xl">
              {/* Modal Header */}
              <div className="p-6 border-b border-dark-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-500 bg-opacity-10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">New Trade Order</h3>
                  </div>
                  <button
                    onClick={() => setShowNewTradeModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2">Enter your trade details below</p>
              </div>
              {/* Modal Content */}
              <form onSubmit={newTradeForm.handleSubmit(onCreateTrade)} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Currency Pair
                    </label>
                    <input
                      {...newTradeForm.register('symbol', { required: 'Symbol is required' })}
                      type="text"
                      className="input w-full bg-dark-800 border-dark-600 focus:border-primary-500 text-gray-100"
                      placeholder="EURUSD"
                    />
                    {newTradeForm.formState.errors.symbol && (
                      <p className="mt-2 text-sm text-bearish-400 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {newTradeForm.formState.errors.symbol.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Order Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="relative">
                        <input
                          {...newTradeForm.register('type', { required: 'Type is required' })}
                          type="radio"
                          value="buy"
                          className="sr-only peer"
                        />
                        <div className="flex items-center justify-center p-4 bg-dark-800 border border-dark-600 rounded-lg cursor-pointer peer-checked:border-bullish-500 peer-checked:bg-bullish-500 peer-checked:bg-opacity-10 transition-all duration-200">
                          <TrendingUp className="w-5 h-5 text-bullish-400 mr-2" />
                          <span className="font-medium text-gray-200 peer-checked:text-bullish-400">BUY</span>
                        </div>
                      </label>
                      <label className="relative">
                        <input
                          {...newTradeForm.register('type', { required: 'Type is required' })}
                          type="radio"
                          value="sell"
                          className="sr-only peer"
                        />
                        <div className="flex items-center justify-center p-4 bg-dark-800 border border-dark-600 rounded-lg cursor-pointer peer-checked:border-bearish-500 peer-checked:bg-bearish-500 peer-checked:bg-opacity-10 transition-all duration-200">
                          <TrendingDown className="w-5 h-5 text-bearish-400 mr-2" />
                          <span className="font-medium text-gray-200 peer-checked:text-bearish-400">SELL</span>
                        </div>
                      </label>
                    </div>
                    {newTradeForm.formState.errors.type && (
                      <p className="mt-2 text-sm text-bearish-400 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {newTradeForm.formState.errors.type.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Volume (Lots)
                      </label>
                      <input
                        {...newTradeForm.register('volume', {
                          required: 'Volume is required',
                          min: { value: 0.01, message: 'Volume must be at least 0.01' },
                        })}
                        type="number"
                        step="0.01"
                        className="input w-full bg-dark-800 border-dark-600 focus:border-primary-500 text-gray-100"
                        placeholder="1.00"
                      />
                      {newTradeForm.formState.errors.volume && (
                        <p className="mt-2 text-sm text-bearish-400 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {newTradeForm.formState.errors.volume.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Open Price
                      </label>
                      <input
                        {...newTradeForm.register('openPrice', {
                          required: 'Open price is required',
                          min: { value: 0, message: 'Price must be positive' },
                        })}
                        type="number"
                        step="0.00001"
                        className="input w-full bg-dark-800 border-dark-600 focus:border-primary-500 text-gray-100"
                        placeholder="1.08500"
                      />
                      {newTradeForm.formState.errors.openPrice && (
                        <p className="mt-2 text-sm text-bearish-400 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {newTradeForm.formState.errors.openPrice.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Comment (Optional)
                    </label>
                    <textarea
                      {...newTradeForm.register('comment')}
                      rows={3}
                      className="input w-full bg-dark-800 border-dark-600 focus:border-primary-500 text-gray-100 resize-none"
                      placeholder="Add a note about this trade..."
                    />
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-dark-700">
                  <button
                    type="button"
                    onClick={() => setShowNewTradeModal(false)}
                    className="btn-secondary px-6 py-3 order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTradeMutation.isLoading}
                    className="btn-primary px-6 py-3 shadow-glow-md hover:shadow-glow-lg order-1 sm:order-2"
                  >
                    {createTradeMutation.isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating Trade...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Execute Trade
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Close Trade Modal */}
      {closingTradeId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Close Trade</h3>
              <button
                onClick={() => setClosingTradeId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={closeTradeForm.handleSubmit(onCloseTrade)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Close Price</label>
                <input
                  {...closeTradeForm.register('closePrice', {
                    required: 'Close price is required',
                    min: { value: 0, message: 'Price must be positive' },
                  })}
                  type="number"
                  step="0.00001"
                  className="input mt-1"
                  placeholder="1.08600"
                />
                {closeTradeForm.formState.errors.closePrice && (
                  <p className="mt-1 text-sm text-red-600">
                    {closeTradeForm.formState.errors.closePrice.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setClosingTradeId(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closeTradeMutation.isLoading}
                  className="btn-danger"
                >
                  {closeTradeMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Closing...
                    </>
                  ) : (
                    'Close Trade'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradingPage