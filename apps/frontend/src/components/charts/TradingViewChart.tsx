import React, { useEffect, useRef, useState } from 'react';

// TradingView Lightweight Charts integration
// Note: This is a simplified version using a free alternative
// For full TradingView integration, you'll need their commercial license

// Type declaration for TradingView Lightweight Charts
declare global {
  interface Window {
    LightweightCharts?: any;
  }
}

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradingViewChartProps {
  symbol: string;
  data: ChartData[];
  height?: number;
  theme?: 'light' | 'dark';
  onSymbolChange?: (symbol: string) => void;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  data,
  height = 500,
  theme = 'dark',
  onSymbolChange
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
    script.async = true;
    script.onload = () => {
      setIsLoading(false);
      initializeChart();
    };
    script.onerror = () => {
      setError('Failed to load charting library');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !error && chartRef.current) {
      updateChartData();
    }
  }, [data, symbol, isLoading, error]);

  const initializeChart = () => {
    if (!chartContainerRef.current || !window.LightweightCharts) return;

    try {
      const chart = window.LightweightCharts.createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height,
        layout: {
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
          textColor: theme === 'dark' ? '#d1d5db' : '#374151',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
        },
        grid: {
          vertLines: {
            color: theme === 'dark' ? '#374151' : '#e5e7eb',
          },
          horzLines: {
            color: theme === 'dark' ? '#374151' : '#e5e7eb',
          },
        },
        crosshair: {
          mode: window.LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        },
        timeScale: {
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Create candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      });

      // Create volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#6b7280',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      chartRef.current = {
        chart,
        candlestickSeries,
        volumeSeries,
      };

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      updateChartData();
    } catch (error) {
      console.error('Failed to initialize chart:', error);
      setError('Failed to initialize chart');
    }
  };

  const updateChartData = () => {
    if (!chartRef.current || !data.length) return;

    try {
      // Format data for TradingView
      const candlestickData = data.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      const volumeData = data
        .filter(item => item.volume !== undefined)
        .map(item => ({
          time: item.time,
          value: item.volume!,
          color: item.close >= item.open ? '#10b98160' : '#ef444460',
        }));

      chartRef.current.candlestickSeries.setData(candlestickData);
      
      if (volumeData.length > 0) {
        chartRef.current.volumeSeries.setData(volumeData);
      }

      // Fit content
      chartRef.current.chart.timeScale().fitContent();
    } catch (error) {
      console.error('Failed to update chart data:', error);
      setError('Failed to update chart data');
    }
  };

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-dark-800 rounded-lg"
        style={{ height }}
      >
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-dark-800 rounded-lg border border-red-500"
        style={{ height }}
      >
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 bg-dark-800 rounded-t-lg border-b border-dark-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-100">{symbol}</h3>
          {data.length > 0 && (
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-400">O:</span>
              <span className="text-gray-200">{data[data.length - 1]?.open.toFixed(4)}</span>
              <span className="text-gray-400">H:</span>
              <span className="text-gray-200">{data[data.length - 1]?.high.toFixed(4)}</span>
              <span className="text-gray-400">L:</span>
              <span className="text-gray-200">{data[data.length - 1]?.low.toFixed(4)}</span>
              <span className="text-gray-400">C:</span>
              <span className={`font-medium ${
                data[data.length - 1]?.close >= data[data.length - 1]?.open 
                  ? 'text-bullish-400' 
                  : 'text-bearish-400'
              }`}>
                {data[data.length - 1]?.close.toFixed(4)}
              </span>
            </div>
          )}
        </div>
        
        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => chartRef.current?.chart.timeScale().fitContent()}
            className="px-3 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors"
            aria-label="Fit chart to content"
          >
            Fit
          </button>
          <label htmlFor="symbol-select" className="sr-only">Select trading symbol</label>
          <select 
            id="symbol-select"
            className="px-2 py-1 text-xs bg-dark-700 text-gray-300 rounded border border-dark-600"
            onChange={(e) => onSymbolChange?.(e.target.value)}
            value={symbol}
            aria-label="Trading symbol selector"
          >
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPUSD">GBP/USD</option>
            <option value="USDJPY">USD/JPY</option>
            <option value="USDCHF">USD/CHF</option>
            <option value="AUDUSD">AUD/USD</option>
            <option value="USDCAD">USD/CAD</option>
            <option value="NZDUSD">NZD/USD</option>
          </select>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        className="w-full bg-dark-800 rounded-b-lg"
        style={{ height }}
        role="img"
        aria-label={`Trading chart for ${symbol} showing candlestick and volume data`}
      />
    </div>
  );
};

export default TradingViewChart;