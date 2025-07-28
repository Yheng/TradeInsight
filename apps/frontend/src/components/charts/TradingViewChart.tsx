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
    // Check if the library is already loaded
    if (window.LightweightCharts) {
      setIsLoading(false);
      initializeChart();
      return;
    }

    // Load TradingView Lightweight Charts script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
    script.async = true;
    script.onload = () => {
      // Wait a moment for the library to be available
      setTimeout(() => {
        if (window.LightweightCharts) {
          setIsLoading(false);
          initializeChart();
        } else {
          setError('Chart library failed to initialize');
          setIsLoading(false);
        }
      }, 100);
    };
    script.onerror = () => {
      setError('Failed to load charting library');
      setIsLoading(false);
    };
    
    // Avoid duplicate script loading
    const existingScript = document.querySelector('script[src*="lightweight-charts"]');
    if (!existingScript) {
      document.head.appendChild(script);
    } else {
      // Script exists but library not loaded yet, wait for it
      const checkLibrary = setInterval(() => {
        if (window.LightweightCharts) {
          clearInterval(checkLibrary);
          setIsLoading(false);
          initializeChart();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkLibrary);
        if (!window.LightweightCharts) {
          setError('Chart library loading timeout');
          setIsLoading(false);
        }
      }, 5000);
    }

    return () => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.remove();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !error && chartRef.current) {
      updateChartData();
    }
  }, [data, symbol, isLoading, error]);

  const initializeChart = () => {
    if (!chartContainerRef.current || !window.LightweightCharts) {
      console.log('Chart initialization requirements not met', {
        container: !!chartContainerRef.current,
        library: !!window.LightweightCharts
      });
      return;
    }

    // Clean up existing chart
    if (chartRef.current?.chart) {
      try {
        chartRef.current.chart.remove();
      } catch (e) {
        console.warn('Error removing existing chart:', e);
      }
    }

    try {
      console.log('Initializing chart with container dimensions:', {
        width: chartContainerRef.current.clientWidth,
        height
      });

      const chart = window.LightweightCharts.createChart(chartContainerRef.current, {
        width: Math.max(400, chartContainerRef.current.clientWidth),
        height: Math.max(300, height),
        layout: {
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
          textColor: theme === 'dark' ? '#d1d5db' : '#374151',
          fontSize: 12,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
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

      console.log('Chart created successfully');

      // Create candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      });

      console.log('Candlestick series added');

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

      console.log('Volume series added');

      chartRef.current = {
        chart,
        candlestickSeries,
        volumeSeries,
      };

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current?.chart) {
          try {
            chartRef.current.chart.applyOptions({
              width: Math.max(400, chartContainerRef.current.clientWidth),
            });
          } catch (e) {
            console.warn('Error during chart resize:', e);
          }
        }
      };

      window.addEventListener('resize', handleResize);

      // Update with data if available
      if (data.length > 0) {
        console.log('Updating chart with data:', data.length, 'items');
        updateChartData();
      } else {
        console.log('No data available for chart');
      }
    } catch (error) {
      console.error('Failed to initialize chart:', error);
      setError('Failed to initialize chart: ' + (error as Error).message);
    }
  };

  const updateChartData = () => {
    if (!chartRef.current || !data.length) return;

    try {
      // Format data for TradingView Lightweight Charts
      const candlestickData = data.map(item => {
        // Convert time to timestamp if it's a string
        let timestamp;
        if (typeof item.time === 'string') {
          timestamp = new Date(item.time).getTime() / 1000;
        } else {
          timestamp = item.time;
        }

        return {
          time: timestamp,
          open: parseFloat(item.open.toString()),
          high: parseFloat(item.high.toString()),
          low: parseFloat(item.low.toString()),
          close: parseFloat(item.close.toString()),
        };
      }).sort((a, b) => a.time - b.time); // Ensure data is sorted by time

      const volumeData = data
        .filter(item => item.volume !== undefined && item.volume !== null)
        .map(item => {
          let timestamp;
          if (typeof item.time === 'string') {
            timestamp = new Date(item.time).getTime() / 1000;
          } else {
            timestamp = item.time;
          }

          return {
            time: timestamp,
            value: parseFloat(item.volume!.toString()),
            color: item.close >= item.open ? '#10b98160' : '#ef444460',
          };
        }).sort((a, b) => a.time - b.time);

      // Clear existing data first
      chartRef.current.candlestickSeries.setData([]);
      chartRef.current.volumeSeries.setData([]);

      // Set new data
      chartRef.current.candlestickSeries.setData(candlestickData);
      
      if (volumeData.length > 0) {
        chartRef.current.volumeSeries.setData(volumeData);
      }

      // Fit content to show all data
      setTimeout(() => {
        if (chartRef.current?.chart) {
          chartRef.current.chart.timeScale().fitContent();
        }
      }, 100);
    } catch (error) {
      console.error('Failed to update chart data:', error);
      setError('Failed to update chart data: ' + (error as Error).message);
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