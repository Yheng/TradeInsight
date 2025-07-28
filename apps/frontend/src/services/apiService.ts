import axios from 'axios'
import { Trade, MarketData, AIAnalysis, Alert, RiskMetrics } from '@tradeinsight/types'

// Use relative URL to take advantage of Vite proxy in development
const API_BASE_URL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || 'http://localhost:3000') : ''

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const parsedToken = JSON.parse(token)
      if (parsedToken.state?.token) {
        config.headers.Authorization = `Bearer ${parsedToken.state.token}`
      }
    } catch (error) {
      console.error('Error parsing token from localStorage:', error)
    }
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export class ApiService {
  // Trades
  static async getTrades(params?: { page?: number; limit?: number; symbol?: string; status?: string }) {
    const response = await api.get('/trades', { params })
    return response.data
  }

  static async getTrade(id: string): Promise<Trade> {
    const response = await api.get(`/trades/${id}`)
    return response.data.data
  }

  static async createTrade(tradeData: {
    symbol: string
    type: 'buy' | 'sell'
    volume: number
    openPrice: number
    comment?: string
  }): Promise<Trade> {
    const response = await api.post('/trades', tradeData)
    return response.data.data
  }

  static async closeTrade(id: string, closePrice: number): Promise<Trade> {
    const response = await api.put(`/trades/${id}/close`, { closePrice })
    return response.data.data
  }

  static async getTradeStats() {
    const response = await api.get('/trades/stats/summary')
    return response.data.data
  }

  // Market Data
  static async getSymbolData(symbol: string): Promise<MarketData> {
    const response = await api.get(`/market/symbols/${symbol}`)
    return response.data.data
  }

  static async getMultipleSymbols(symbols: string[]): Promise<MarketData[]> {
    const response = await api.post('/market/symbols', { symbols })
    return response.data.data
  }

  static async getHistoricalData(symbol: string, timeframe = '1H', count = 100) {
    try {
      const response = await api.get(`/market/symbols/${symbol}/history`, {
        params: { timeframe, count }
      })
      return response.data.data
    } catch (error) {
      // If authenticated endpoint fails, try test endpoint
      console.log('Authenticated endpoint failed, trying test endpoint:', error)
      try {
        const testResponse = await api.get(`/test/market/${symbol}/history`, {
          params: { timeframe, count }
        })
        return testResponse.data.data
      } catch (testError) {
        console.log('Test endpoint also failed:', testError)
        throw testError
      }
    }
  }

  // Analytics
  static async getAIAnalysis(symbol: string): Promise<AIAnalysis> {
    const response = await api.get(`/analytics/ai/${symbol}`)
    return response.data.data
  }

  static async getRiskMetrics(): Promise<RiskMetrics> {
    const response = await api.get('/analytics/risk')
    return response.data.data
  }

  static async getPerformanceData(period = '30d') {
    const response = await api.get('/analytics/performance', {
      params: { period }
    })
    return response.data.data
  }

  // Alerts
  static async getAlerts(): Promise<Alert[]> {
    const response = await api.get('/alerts')
    return response.data.data
  }

  static async createAlert(alertData: {
    type: 'price' | 'profit_loss' | 'risk' | 'news'
    symbol?: string
    condition: string
    value: number
  }): Promise<Alert> {
    const response = await api.post('/alerts', alertData)
    return response.data.data
  }

  static async updateAlert(id: string, data: { isActive: boolean }): Promise<Alert> {
    const response = await api.put(`/alerts/${id}`, data)
    return response.data.data
  }

  static async deleteAlert(id: string): Promise<void> {
    await api.delete(`/alerts/${id}`)
  }

  // User
  static async getUserProfile() {
    const response = await api.get('/users/profile')
    return response.data.data
  }
}

export default ApiService