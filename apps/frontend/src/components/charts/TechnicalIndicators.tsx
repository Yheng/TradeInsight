import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  description: string;
}

interface TechnicalIndicatorsProps {
  symbol: string;
  data: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
}

export const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({
  symbol,
  data
}) => {
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'trend' | 'momentum' | 'volatility'>('trend');

  useEffect(() => {
    if (data.length > 0) {
      calculateIndicators();
    }
  }, [data, symbol]);

  const calculateIndicators = () => {
    const calculatedIndicators: TechnicalIndicator[] = [];

    // Simple Moving Average (SMA)
    const sma20 = calculateSMA(data, 20);
    const sma50 = calculateSMA(data, 50);
    const currentPrice = data[data.length - 1]?.close || 0;

    if (sma20.length > 0 && sma50.length > 0) {
      const sma20Value = sma20[sma20.length - 1];
      const sma50Value = sma50[sma50.length - 1];
      
      calculatedIndicators.push({
        name: 'SMA 20/50',
        value: ((currentPrice - sma20Value) / sma20Value) * 100,
        signal: currentPrice > sma20Value && sma20Value > sma50Value ? 'buy' : 
                currentPrice < sma20Value && sma20Value < sma50Value ? 'sell' : 'neutral',
        description: 'Price vs 20-period moving average'
      });
    }

    // RSI
    const rsi = calculateRSI(data, 14);
    if (rsi.length > 0) {
      const rsiValue = rsi[rsi.length - 1];
      calculatedIndicators.push({
        name: 'RSI (14)',
        value: rsiValue,
        signal: rsiValue > 70 ? 'sell' : rsiValue < 30 ? 'buy' : 'neutral',
        description: 'Relative Strength Index'
      });
    }

    // MACD
    const macd = calculateMACD(data);
    if (macd.length > 0) {
      const macdValue = macd[macd.length - 1];
      calculatedIndicators.push({
        name: 'MACD',
        value: macdValue.macd,
        signal: macdValue.macd > macdValue.signal ? 'buy' : 'sell',
        description: 'Moving Average Convergence Divergence'
      });
    }

    // Bollinger Bands
    const bollinger = calculateBollingerBands(data, 20, 2);
    if (bollinger.length > 0) {
      const bollingerValue = bollinger[bollinger.length - 1];
      const position = (currentPrice - bollingerValue.lower) / (bollingerValue.upper - bollingerValue.lower);
      
      calculatedIndicators.push({
        name: 'Bollinger Bands',
        value: position * 100,
        signal: position > 0.8 ? 'sell' : position < 0.2 ? 'buy' : 'neutral',
        description: 'Price position within Bollinger Bands'
      });
    }

    // Stochastic Oscillator
    const stochastic = calculateStochastic(data, 14);
    if (stochastic.length > 0) {
      const stochasticValue = stochastic[stochastic.length - 1];
      calculatedIndicators.push({
        name: 'Stochastic %K',
        value: stochasticValue,
        signal: stochasticValue > 80 ? 'sell' : stochasticValue < 20 ? 'buy' : 'neutral',
        description: 'Stochastic Oscillator'
      });
    }

    setIndicators(calculatedIndicators);
  };

  // Technical Analysis Calculations
  const calculateSMA = (data: any[], period: number): number[] => {
    const sma: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
      sma.push(sum / period);
    }
    return sma;
  };

  const calculateRSI = (data: any[], period: number): number[] => {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  };

  const calculateMACD = (data: any[]): Array<{ macd: number; signal: number; histogram: number }> => {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    const macdLine: number[] = [];

    for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }

    const signalLine = calculateEMAFromArray(macdLine, 9);
    const result: Array<{ macd: number; signal: number; histogram: number }> = [];

    for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
      result.push({
        macd: macdLine[i],
        signal: signalLine[i],
        histogram: macdLine[i] - signalLine[i]
      });
    }

    return result;
  };

  const calculateEMA = (data: any[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    if (data.length === 0) return ema;
    
    ema[0] = data[0].close;
    
    for (let i = 1; i < data.length; i++) {
      ema[i] = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1];
    }
    
    return ema;
  };

  const calculateEMAFromArray = (data: number[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    if (data.length === 0) return ema;
    
    ema[0] = data[0];
    
    for (let i = 1; i < data.length; i++) {
      ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    
    return ema;
  };

  const calculateBollingerBands = (data: any[], period: number, stdDev: number) => {
    const sma = calculateSMA(data, period);
    const bands: Array<{ upper: number; middle: number; lower: number }> = [];

    for (let i = 0; i < sma.length; i++) {
      const dataSlice = data.slice(i, i + period);
      const variance = dataSlice.reduce((acc, item) => {
        return acc + Math.pow(item.close - sma[i], 2);
      }, 0) / period;
      
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: sma[i] + (standardDeviation * stdDev),
        middle: sma[i],
        lower: sma[i] - (standardDeviation * stdDev)
      });
    }

    return bands;
  };

  const calculateStochastic = (data: any[], period: number): number[] => {
    const stochastic: number[] = [];

    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const highest = Math.max(...slice.map(item => item.high));
      const lowest = Math.min(...slice.map(item => item.low));
      const current = data[i].close;

      if (highest === lowest) {
        stochastic.push(50);
      } else {
        stochastic.push(((current - lowest) / (highest - lowest)) * 100);
      }
    }

    return stochastic;
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-bullish-400';
      case 'sell': return 'text-bearish-400';
      default: return 'text-gray-400';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy': return <TrendingUp className="w-4 h-4" />;
      case 'sell': return <TrendingUp className="w-4 h-4 rotate-180" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const filteredIndicators = indicators.filter(indicator => {
    switch (selectedCategory) {
      case 'trend':
        return ['SMA 20/50', 'MACD', 'Bollinger Bands'].includes(indicator.name);
      case 'momentum':
        return ['RSI (14)', 'Stochastic %K'].includes(indicator.name);
      case 'volatility':
        return ['Bollinger Bands'].includes(indicator.name);
      default:
        return true;
    }
  });

  const overallSentiment = () => {
    const buySignals = indicators.filter(i => i.signal === 'buy').length;
    const sellSignals = indicators.filter(i => i.signal === 'sell').length;
    
    if (buySignals > sellSignals) return 'buy';
    if (sellSignals > buySignals) return 'sell';
    return 'neutral';
  };

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Technical Analysis - {symbol}
        </h3>
        
        {/* Category Filter */}
        <div className="flex rounded-lg overflow-hidden bg-dark-700">
          {(['trend', 'momentum', 'volatility'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Sentiment */}
      <div className="mb-6 p-4 bg-dark-700 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Overall Signal</span>
          <div className={`flex items-center space-x-2 ${getSignalColor(overallSentiment())}`}>
            {getSignalIcon(overallSentiment())}
            <span className="font-medium capitalize">{overallSentiment()}</span>
          </div>
        </div>
      </div>

      {/* Indicators List */}
      <div className="space-y-4">
        {filteredIndicators.map((indicator, index) => (
          <div key={index} className="p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-200">{indicator.name}</h4>
              <div className={`flex items-center space-x-2 ${getSignalColor(indicator.signal)}`}>
                {getSignalIcon(indicator.signal)}
                <span className="text-sm font-medium capitalize">{indicator.signal}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{indicator.description}</span>
              <span className="text-gray-200 font-mono">
                {indicator.value.toFixed(2)}
                {indicator.name.includes('%') || indicator.name === 'Bollinger Bands' ? '%' : ''}
              </span>
            </div>

            {/* Value Bar */}
            <div className="mt-2 w-full bg-dark-600 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${
                  indicator.signal === 'buy' ? 'bg-bullish-400' :
                  indicator.signal === 'sell' ? 'bg-bearish-400' : 'bg-gray-400'
                }`}
                style={{ 
                  width: `${Math.abs(indicator.value) > 100 ? 100 : Math.abs(indicator.value)}%` 
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {indicators.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No market data available for technical analysis</p>
        </div>
      )}
    </div>
  );
};

export default TechnicalIndicators;