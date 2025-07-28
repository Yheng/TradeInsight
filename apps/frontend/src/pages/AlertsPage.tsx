import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Bell, X, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import ApiService from '@/services/apiService'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Alert } from '@tradeinsight/types'

interface NewAlertForm {
  type: 'price' | 'profit_loss' | 'risk' | 'news'
  symbol?: string
  condition: string
  value: number
}

const AlertsPage = () => {
  const [showNewAlertModal, setShowNewAlertModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery('alerts', ApiService.getAlerts, {
    refetchInterval: 30000,
  })

  const createAlertMutation = useMutation(ApiService.createAlert, {
    onSuccess: () => {
      queryClient.invalidateQueries('alerts')
      setShowNewAlertModal(false)
      alertForm.reset()
    },
  })

  const updateAlertMutation = useMutation(
    ({ id, data }: { id: string; data: { isActive: boolean } }) =>
      ApiService.updateAlert(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alerts')
      },
    }
  )

  const deleteAlertMutation = useMutation(ApiService.deleteAlert, {
    onSuccess: () => {
      queryClient.invalidateQueries('alerts')
    },
  })

  const alertForm = useForm<NewAlertForm>()

  const onCreateAlert = async (data: NewAlertForm) => {
    await createAlertMutation.mutateAsync(data)
  }

  const toggleAlert = async (alert: Alert) => {
    await updateAlertMutation.mutateAsync({
      id: alert.id,
      data: { isActive: !alert.isActive },
    })
  }

  const deleteAlert = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      await deleteAlertMutation.mutateAsync(id)
    }
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

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'price':
        return 'bg-blue-100 text-blue-800'
      case 'profit_loss':
        return 'bg-green-100 text-green-800'
      case 'risk':
        return 'bg-red-100 text-red-800'
      case 'news':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600">Manage your trading alerts and notifications</p>
        </div>
        <button
          onClick={() => setShowNewAlertModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Alert
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert: Alert) => (
            <div
              key={alert.id}
              className={`card ${alert.isActive ? 'border-primary-200' : 'border-gray-200'}`}
            >
              <div className="card-content p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Bell
                        className={`w-6 h-6 ${
                          alert.isActive ? 'text-primary-600' : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(
                            alert.type
                          )}`}
                        >
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {alert.symbol && (
                          <span className="text-sm font-medium text-gray-900">{alert.symbol}</span>
                        )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.isActive
                              ? 'bg-success-100 text-success-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {alert.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {alert.isTriggered && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                            Triggered
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{alert.condition}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Value: {alert.value} • Created: {formatDate(alert.createdAt.toString())}
                        {alert.triggeredAt && (
                          <span> • Triggered: {formatDate(alert.triggeredAt.toString())}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAlert(alert)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        alert.isActive
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      }`}
                    >
                      {alert.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <div className="card-content text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first alert.
              </p>
              <div className="mt-6">
                <button onClick={() => setShowNewAlertModal(true)} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  New Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Alert Modal */}
      {showNewAlertModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">New Alert</h3>
              <button
                onClick={() => setShowNewAlertModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={alertForm.handleSubmit(onCreateAlert)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Alert Type</label>
                <select
                  {...alertForm.register('type', { required: 'Alert type is required' })}
                  className="input mt-1"
                >
                  <option value="">Select type</option>
                  <option value="price">Price Alert</option>
                  <option value="profit_loss">Profit/Loss Alert</option>
                  <option value="risk">Risk Alert</option>
                  <option value="news">News Alert</option>
                </select>
                {alertForm.formState.errors.type && (
                  <p className="mt-1 text-sm text-red-600">
                    {alertForm.formState.errors.type.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Symbol (Optional)
                </label>
                <input
                  {...alertForm.register('symbol')}
                  type="text"
                  className="input mt-1"
                  placeholder="EURUSD"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Condition</label>
                <input
                  {...alertForm.register('condition', { required: 'Condition is required' })}
                  type="text"
                  className="input mt-1"
                  placeholder="Price above 1.0850"
                />
                {alertForm.formState.errors.condition && (
                  <p className="mt-1 text-sm text-red-600">
                    {alertForm.formState.errors.condition.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Value</label>
                <input
                  {...alertForm.register('value', {
                    required: 'Value is required',
                    min: { value: 0, message: 'Value must be positive' },
                  })}
                  type="number"
                  step="0.00001"
                  className="input mt-1"
                  placeholder="1.08500"
                />
                {alertForm.formState.errors.value && (
                  <p className="mt-1 text-sm text-red-600">
                    {alertForm.formState.errors.value.message}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAlertModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAlertMutation.isLoading}
                  className="btn-primary"
                >
                  {createAlertMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Alert'
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

export default AlertsPage