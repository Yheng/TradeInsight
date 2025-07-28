"""
Data Processing Utilities for ML Analytics Service
Handles data fetching, cleaning, and preprocessing for ML models
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
import yfinance as yf
import requests
import sqlite3
import os

logger = logging.getLogger(__name__)

class DataProcessor:
    """
    Handles data collection and preprocessing for ML models
    Supports multiple data sources: yfinance, MT5, internal database
    """
    
    def __init__(self):
        self.forex_symbols = {
            'EURUSD': 'EURUSD=X',
            'GBPUSD': 'GBPUSD=X',
            'USDJPY': 'USDJPY=X',
            'USDCHF': 'USDCHF=X',
            'AUDUSD': 'AUDUSD=X',
            'USDCAD': 'USDCAD=X',
            'NZDUSD': 'NZDUSD=X',
            'EURJPY': 'EURJPY=X',
            'GBPJPY': 'GBPJPY=X',
            'CHFJPY': 'CHFJPY=X'
        }
        
        # Database connection for TradeInsight data
        self.db_path = os.path.join('..', '..', 'apps', 'api', 'database.sqlite')
    
    def get_market_data(self, symbol: str, timeframe: str = '1h', 
                       lookback_days: int = 90) -> pd.DataFrame:
        """
        Fetch market data from various sources
        
        Args:
            symbol: Trading symbol (e.g., 'EURUSD')
            timeframe: Data timeframe ('1m', '5m', '15m', '1h', '4h', '1d')
            lookback_days: Number of days to look back
        
        Returns:
            DataFrame with OHLCV data
        """
        try:
            # Try internal database first
            internal_data = self._get_internal_data(symbol, timeframe, lookback_days)
            if not internal_data.empty:
                logger.info(f"Retrieved {len(internal_data)} records from internal database for {symbol}")
                return internal_data
            
            # Fallback to yfinance
            logger.info(f"Fetching data from yfinance for {symbol}")
            return self._get_yfinance_data(symbol, timeframe, lookback_days)
            
        except Exception as e:
            logger.error(f"Failed to fetch data for {symbol}: {e}")
            return pd.DataFrame()
    
    def _get_internal_data(self, symbol: str, timeframe: str, lookback_days: int) -> pd.DataFrame:
        """Fetch data from internal TradeInsight database"""
        try:
            if not os.path.exists(self.db_path):
                return pd.DataFrame()
            
            conn = sqlite3.connect(self.db_path)
            
            # Calculate start date
            start_date = (datetime.utcnow() - timedelta(days=lookback_days)).isoformat()
            
            # Query market data
            query = """
            SELECT timestamp, open_price, high_price, low_price, close_price, volume
            FROM market_data 
            WHERE symbol = ? AND timestamp >= ?
            ORDER BY timestamp ASC
            """
            
            df = pd.read_sql_query(query, conn, params=[symbol, start_date])
            conn.close()
            
            if df.empty:
                return pd.DataFrame()
            
            # Rename columns to standard format
            df = df.rename(columns={
                'open_price': 'open',
                'high_price': 'high',
                'low_price': 'low',
                'close_price': 'close'
            })
            
            # Convert timestamp to datetime index
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)
            
            # Resample to requested timeframe if needed
            df = self._resample_data(df, timeframe)
            
            return df
            
        except Exception as e:
            logger.warning(f"Failed to fetch internal data: {e}")
            return pd.DataFrame()
    
    def _get_yfinance_data(self, symbol: str, timeframe: str, lookback_days: int) -> pd.DataFrame:
        """Fetch data from Yahoo Finance"""
        try:
            # Map symbol to yfinance format
            yf_symbol = self.forex_symbols.get(symbol, symbol)
            
            # Map timeframe to yfinance interval
            interval_map = {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '1h': '1h',
                '4h': '4h',
                '1d': '1d'
            }
            
            interval = interval_map.get(timeframe, '1h')
            
            # Calculate period
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=lookback_days)
            
            # Fetch data
            ticker = yf.Ticker(yf_symbol)
            data = ticker.history(
                start=start_date,
                end=end_date,
                interval=interval,
                auto_adjust=True,
                prepost=True
            )
            
            if data.empty:
                logger.warning(f"No data returned from yfinance for {symbol}")
                return pd.DataFrame()
            
            # Standardize column names
            data.columns = [col.lower() for col in data.columns]
            
            # Ensure we have the required columns
            required_columns = ['open', 'high', 'low', 'close', 'volume']
            for col in required_columns:
                if col not in data.columns:
                    if col == 'volume':
                        data[col] = 1.0  # Default volume for forex
                    else:
                        logger.error(f"Missing required column: {col}")
                        return pd.DataFrame()
            
            return data[required_columns]
            
        except Exception as e:
            logger.error(f"Failed to fetch yfinance data: {e}")
            return pd.DataFrame()
    
    def _resample_data(self, data: pd.DataFrame, target_timeframe: str) -> pd.DataFrame:
        """Resample data to target timeframe"""
        try:
            # Map timeframe to pandas frequency
            freq_map = {
                '1m': '1T',
                '5m': '5T',
                '15m': '15T',
                '1h': '1H',
                '4h': '4H',
                '1d': '1D'
            }
            
            freq = freq_map.get(target_timeframe)
            if not freq:
                return data
            
            # Resample OHLCV data
            resampled = data.resample(freq).agg({
                'open': 'first',
                'high': 'max',
                'low': 'min',
                'close': 'last',
                'volume': 'sum'
            }).dropna()
            
            return resampled
            
        except Exception as e:
            logger.error(f"Failed to resample data: {e}")
            return data
    
    def clean_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate market data"""
        if data.empty:
            return data
        
        # Remove any rows with NaN values in OHLC
        data = data.dropna(subset=['open', 'high', 'low', 'close'])
        
        # Validate OHLC relationships
        invalid_rows = (
            (data['high'] < data['low']) |
            (data['high'] < data['open']) |
            (data['high'] < data['close']) |
            (data['low'] > data['open']) |
            (data['low'] > data['close'])
        )
        
        if invalid_rows.any():
            logger.warning(f"Removing {invalid_rows.sum()} invalid OHLC rows")
            data = data[~invalid_rows]
        
        # Remove extreme outliers (more than 10 standard deviations)
        for col in ['open', 'high', 'low', 'close']:
            mean_val = data[col].mean()
            std_val = data[col].std()
            outlier_threshold = 10 * std_val
            
            outliers = (
                (data[col] > mean_val + outlier_threshold) |
                (data[col] < mean_val - outlier_threshold)
            )
            
            if outliers.any():
                logger.warning(f"Removing {outliers.sum()} outliers in {col}")
                data = data[~outliers]
        
        # Ensure volume is positive
        if 'volume' in data.columns:
            data['volume'] = data['volume'].abs()
            data.loc[data['volume'] == 0, 'volume'] = 1.0  # Default volume
        
        return data
    
    def get_multiple_symbols(self, symbols: List[str], timeframe: str = '1h', 
                           lookback_days: int = 90) -> Dict[str, pd.DataFrame]:
        """Fetch data for multiple symbols"""
        data_dict = {}
        
        for symbol in symbols:
            data = self.get_market_data(symbol, timeframe, lookback_days)
            if not data.empty:
                data_dict[symbol] = self.clean_data(data)
            else:
                logger.warning(f"No data available for {symbol}")
        
        return data_dict
    
    def synchronize_data(self, data_dict: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
        """Synchronize timestamps across multiple symbol datasets"""
        if not data_dict:
            return {}
        
        # Find common time range
        start_times = [df.index.min() for df in data_dict.values()]
        end_times = [df.index.max() for df in data_dict.values()]
        
        common_start = max(start_times)
        common_end = min(end_times)
        
        # Filter all datasets to common timeframe
        synchronized_data = {}
        for symbol, df in data_dict.items():
            filtered_df = df[(df.index >= common_start) & (df.index <= common_end)]
            if not filtered_df.empty:
                synchronized_data[symbol] = filtered_df
        
        return synchronized_data
    
    def calculate_correlations(self, data_dict: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Calculate correlation matrix for multiple symbols"""
        if len(data_dict) < 2:
            return pd.DataFrame()
        
        # Synchronize data first
        sync_data = self.synchronize_data(data_dict)
        
        # Extract close prices
        close_prices = {}
        for symbol, df in sync_data.items():
            close_prices[symbol] = df['close']
        
        # Create correlation matrix
        correlation_df = pd.DataFrame(close_prices)
        correlation_matrix = correlation_df.corr()
        
        return correlation_matrix
    
    def get_economic_calendar(self, lookback_days: int = 30) -> pd.DataFrame:
        """Fetch economic calendar data (placeholder implementation)"""
        # This would typically connect to an economic calendar API
        # For now, return empty DataFrame
        return pd.DataFrame()
    
    def get_news_sentiment_data(self, symbol: str, lookback_days: int = 7) -> pd.DataFrame:
        """Fetch news sentiment data (placeholder implementation)"""
        # This would typically connect to news sentiment APIs
        # For now, return empty DataFrame
        return pd.DataFrame()
    
    def validate_data_quality(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Assess data quality metrics"""
        if data.empty:
            return {'quality_score': 0, 'issues': ['No data available']}
        
        issues = []
        quality_score = 100
        
        # Check for missing values
        missing_pct = data.isnull().sum().sum() / (len(data) * len(data.columns)) * 100
        if missing_pct > 0:
            issues.append(f"Missing values: {missing_pct:.2f}%")
            quality_score -= missing_pct
        
        # Check for gaps in timestamps
        if isinstance(data.index, pd.DatetimeIndex):
            time_diffs = data.index.to_series().diff()
            expected_freq = time_diffs.mode().iloc[0] if not time_diffs.mode().empty else None
            
            if expected_freq:
                large_gaps = time_diffs > expected_freq * 2
                gap_count = large_gaps.sum()
                
                if gap_count > 0:
                    issues.append(f"Large time gaps: {gap_count}")
                    quality_score -= min(20, gap_count * 2)
        
        # Check for duplicate timestamps
        if data.index.duplicated().any():
            duplicate_count = data.index.duplicated().sum()
            issues.append(f"Duplicate timestamps: {duplicate_count}")
            quality_score -= min(10, duplicate_count)
        
        # Check data freshness
        if isinstance(data.index, pd.DatetimeIndex) and len(data) > 0:
            latest_timestamp = data.index.max()
            age_hours = (datetime.utcnow() - latest_timestamp.tz_localize(None)).total_seconds() / 3600
            
            if age_hours > 24:
                issues.append(f"Data age: {age_hours:.1f} hours")
                quality_score -= min(30, age_hours)
        
        return {
            'quality_score': max(0, quality_score),
            'issues': issues,
            'records_count': len(data),
            'date_range': {
                'start': data.index.min().isoformat() if isinstance(data.index, pd.DatetimeIndex) and len(data) > 0 else None,
                'end': data.index.max().isoformat() if isinstance(data.index, pd.DatetimeIndex) and len(data) > 0 else None
            }
        }