import axios from 'axios';
import { logger } from '@tradeinsight/utils';

export interface MT5ConnectionData {
  login: string;
  password: string;
  server: string;
}

export interface MT5TradeData {
  ticket: number;
  order: number;
  time: number;
  type: string;
  entry: string;
  volume: number;
  price: number;
  commission: number;
  swap: number;
  profit: number;
  symbol: string;
  comment: string;
  magic: number;
}

export interface MT5AccountInfo {
  login: number;
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  margin_level: number;
  currency: string;
  server: string;
  company: string;
}

export interface MT5SymbolInfo {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  time: number;
  spread: number;
  digits: number;
  point: number;
  contract_size: number;
}

export class MT5Service {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.MT5_SERVICE_URL || 'http://localhost:5000';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('MT5 service health check failed:', error);
      return false;
    }
  }

  async connectToMT5(credentials: MT5ConnectionData): Promise<{ success: boolean; account_info?: MT5AccountInfo; error?: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/api/connect`, credentials, {
        timeout: 10000
      });
      
      return {
        success: response.data.success,
        account_info: response.data.account_info
      };
    } catch (error: any) {
      logger.error('Failed to connect to MT5:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async disconnectFromMT5(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/api/disconnect`, {}, {
        timeout: 5000
      });
      
      return {
        success: response.data.success
      };
    } catch (error: any) {
      logger.error('Failed to disconnect from MT5:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getTradeHistory(startDate?: string, endDate?: string, maxTrades = 1000): Promise<{ trades: MT5TradeData[]; count: number; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('max_trades', maxTrades.toString());

      const response = await axios.get(`${this.baseURL}/api/trades/history?${params}`, {
        timeout: 15000
      });
      
      return {
        trades: response.data.trades || [],
        count: response.data.count || 0
      };
    } catch (error: any) {
      logger.error('Failed to get trade history:', error);
      return {
        trades: [],
        count: 0,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getAccountInfo(): Promise<{ account_info?: MT5AccountInfo; error?: string }> {
    try {
      const response = await axios.get(`${this.baseURL}/api/account`, {
        timeout: 5000
      });
      
      return {
        account_info: response.data
      };
    } catch (error: any) {
      logger.error('Failed to get account info:', error);
      return {
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getSymbolInfo(symbol: string): Promise<{ symbol_info?: MT5SymbolInfo; error?: string }> {
    try {
      const response = await axios.get(`${this.baseURL}/api/symbol-info/${symbol}`, {
        timeout: 5000
      });
      
      return {
        symbol_info: response.data
      };
    } catch (error: any) {
      logger.error(`Failed to get symbol info for ${symbol}:`, error);
      return {
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getPositions(): Promise<{ positions: any[]; error?: string }> {
    try {
      const response = await axios.get(`${this.baseURL}/api/positions`, {
        timeout: 5000
      });
      
      return {
        positions: response.data || []
      };
    } catch (error: any) {
      logger.error('Failed to get positions:', error);
      return {
        positions: [],
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getRates(symbol: string, timeframe = '1H', count = 100): Promise<{ rates: any[]; error?: string }> {
    try {
      const params = new URLSearchParams({
        timeframe,
        count: count.toString()
      });

      const response = await axios.get(`${this.baseURL}/api/rates/${symbol}?${params}`, {
        timeout: 10000
      });
      
      return {
        rates: response.data || []
      };
    } catch (error: any) {
      logger.error(`Failed to get rates for ${symbol}:`, error);
      return {
        rates: [],
        error: error.response?.data?.error || error.message
      };
    }
  }

  async getAvailableSymbols(): Promise<{ symbols: any[]; error?: string }> {
    try {
      const response = await axios.get(`${this.baseURL}/api/symbols`, {
        timeout: 10000
      });
      
      return {
        symbols: response.data || []
      };
    } catch (error: any) {
      logger.error('Failed to get available symbols:', error);
      return {
        symbols: [],
        error: error.response?.data?.error || error.message
      };
    }
  }
}

export const mt5Service = new MT5Service();