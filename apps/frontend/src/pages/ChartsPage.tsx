import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { BarChart3, TrendingUp, RefreshCw, Settings } from 'lucide-react';
import TradingViewChart from '@/components/charts/TradingViewChart';
import TechnicalIndicators from '@/components/charts/TechnicalIndicators';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ApiService from '@/services/apiService';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TimeFrame {
  label: string;
  value: string;
}

const ChartsPage: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [showIndicators, setShowIndicators] = useState(true);

  const timeframes: TimeFrame[] = [
    { label: '1M', value: '1M' },
    { label: '5M', value: '5M' },
    { label: '15M', value: '15M' },
    { label: '30M', value: '30M' },
    { label: '1H', value: '1H' },
    { label: '4H', value: '4H' },
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' }
  ];

  const popularSymbols = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF',
    'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY',
    'GBPJPY', 'EURGBP', 'AUDCAD', 'AUDNZD'
  ];

  // Fetch historical data
  const { isLoading, error, refetch } = useQuery(
    ['historicalData', selectedSymbol, selectedTimeframe],
    () => ApiService.getHistoricalData(selectedSymbol, selectedTimeframe, 200),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      retry: 1, // Only retry once, then use fallback
      onSuccess: (data) => {
        console.log('API data received:', data);
        if (data && Array.isArray(data) && data.length > 0) {
          // Transform data to chart format
          const formattedData: ChartData[] = data.map((item: any) => ({
            time: item.time || item.timestamp,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: item.volume ? parseFloat(item.volume) : undefined
          }));
          console.log('Setting formatted data:', formattedData.length, 'items');
          setChartData(formattedData);
        } else {
          console.log('No valid data from API, will use sample data');
        }
      },
      onError: (error) => {
        console.log('API error, will use sample data:', error);
      }
    }
  );

  // Generate sample data if API doesn't return data
  useEffect(() => {
    console.log('Chart data check:', { isLoading, chartDataLength: chartData.length, error });
    // For debugging: always generate sample data for now
    console.log('Generating sample data for', selectedSymbol);
    generateSampleData();
  }, [selectedSymbol]);

  const generateSampleData = () => {
    console.log('Generating sample data for symbol:', selectedSymbol);
    const sampleData: ChartData[] = [];
    const basePrice = selectedSymbol === 'EURUSD' ? 1.0950 :
                     selectedSymbol === 'GBPUSD' ? 1.2750 :
                     selectedSymbol === 'USDJPY' ? 149.50 : 1.0000;
    
    let currentPrice = basePrice;
    const now = new Date();
    
    for (let i = 199; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly data
      
      // Generate realistic price movement
      const volatility = 0.001; // 0.1% volatility
      const trend = (Math.random() - 0.5) * volatility;
      const high = currentPrice * (1 + Math.random() * volatility);
      const low = currentPrice * (1 - Math.random() * volatility);
      const close = currentPrice * (1 + trend);
      
      sampleData.push({
        time: time.toISOString(),
        open: currentPrice,
        high: Math.max(currentPrice, high, close),
        low: Math.min(currentPrice, low, close),
        close: close,
        volume: Math.floor(Math.random() * 1000000) + 500000
      });
      
      currentPrice = close;
    }
    
    console.log('Generated sample data:', sampleData.length, 'items');
    console.log('Sample data preview:', sampleData.slice(0, 3));
    setChartData(sampleData);
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  const formatPrice = (price: number) => {
    if (selectedSymbol.includes('JPY')) {
      return price.toFixed(2);
    }
    return price.toFixed(4);
  };

  const getPriceChange = () => {
    if (chartData.length < 2) return { change: 0, percentage: 0 };
    
    const current = chartData[chartData.length - 1].close;
    const previous = chartData[chartData.length - 2].close;
    const change = current - previous;
    const percentage = (change / previous) * 100;
    
    return { change, percentage };
  };

  const priceChange = getPriceChange();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-primary-400" />
            Advanced Charts
          </h1>
          <p className="text-gray-400 mt-1">Professional trading charts with technical analysis</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showIndicators
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-dark-600 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 mr-2 inline" />
            Indicators
          </button>
          
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      </div>

      {/* Symbol and Timeframe Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symbol Selection */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Select Symbol</h3>
          <div className="grid grid-cols-3 gap-2">
            {popularSymbols.map((symbol) => (
              <button
                key={symbol}
                onClick={() => handleSymbolChange(symbol)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedSymbol === symbol
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe Selection */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Timeframe</h3>
          <div className="grid grid-cols-4 gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => handleTimeframeChange(tf.value)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedTimeframe === tf.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Price Info */}
      {chartData.length > 0 && (
        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">{selectedSymbol}</h2>
              <p className="text-sm text-gray-400">{selectedTimeframe} Chart</p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-100">
                {formatPrice(chartData[chartData.length - 1].close)}
              </div>
              <div className={`text-sm flex items-center ${
                priceChange.change >= 0 ? 'text-bullish-400' : 'text-bearish-400'
              }`}>
                <TrendingUp className={`w-4 h-4 mr-1 ${priceChange.change < 0 ? 'rotate-180' : ''}`} />
                {priceChange.change >= 0 ? '+' : ''}{formatPrice(priceChange.change)} 
                ({priceChange.percentage.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className={`grid gap-6 ${showIndicators ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
        {/* Main Chart */}
        <div className={showIndicators ? 'lg:col-span-2' : 'col-span-1'}>
          {isLoading ? (
            <div className="bg-dark-800 rounded-lg flex items-center justify-center" style={{ height: 600 }}>
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <TradingViewChart
              symbol={selectedSymbol}
              data={chartData}
              height={600}
              theme="dark"
              onSymbolChange={handleSymbolChange}
            />
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
              Chart data: {chartData.length} items | Symbol: {selectedSymbol}
            </div>
          )}
        </div>

        {/* Technical Indicators */}
        {showIndicators && (
          <div>
            <TechnicalIndicators
              symbol={selectedSymbol}
              data={chartData}
            />
          </div>
        )}
      </div>

      {/* Chart Controls and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Statistics */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Chart Statistics</h3>
          {chartData.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Period High</p>
                <p className="text-lg font-semibold text-bullish-400">
                  {formatPrice(Math.max(...chartData.map(d => d.high)))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Period Low</p>
                <p className="text-lg font-semibold text-bearish-400">
                  {formatPrice(Math.min(...chartData.map(d => d.low)))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Average Volume</p>
                <p className="text-lg font-semibold text-gray-200">
                  {chartData.filter(d => d.volume).length > 0
                    ? (chartData.filter(d => d.volume).reduce((sum, d) => sum + (d.volume || 0), 0) / chartData.filter(d => d.volume).length / 1000).toFixed(0) + 'K'
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Data Points</p>
                <p className="text-lg font-semibold text-gray-200">{chartData.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Market Status */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Market Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <span className="text-bullish-400 font-medium">Market Open</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Last Update</span>
              <span className="text-gray-200">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Server Time</span>
              <span className="text-gray-200">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Spread</span>
              <span className="text-gray-200">1.2 pips</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsPage;