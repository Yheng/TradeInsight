"""
Feature Engineering Utilities for ML Models
Creates comprehensive feature sets for trading models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
import logging
import ta
from scipy.stats import zscore
from sklearn.preprocessing import StandardScaler, RobustScaler

logger = logging.getLogger(__name__)

class FeatureEngineer:
    """
    Advanced feature engineering for trading ML models
    Creates technical, statistical, and market microstructure features
    """
    
    def __init__(self):
        self.scalers = {}
        self.feature_importance = {}
        
    def create_features(self, data: pd.DataFrame, 
                       feature_types: List[str] = None) -> pd.DataFrame:
        """
        Create comprehensive feature set from OHLCV data
        
        Args:
            data: OHLCV DataFrame
            feature_types: List of feature types to create
        
        Returns:
            DataFrame with engineered features
        """
        if feature_types is None:
            feature_types = ['price', 'volume', 'indicators', 'statistical', 'time']
        
        try:
            df = data.copy()
            
            # Validate input data
            if not self._validate_data(df):
                logger.error("Invalid input data for feature engineering")
                return pd.DataFrame()
            
            # Create different types of features
            if 'price' in feature_types:
                df = self._create_price_features(df)
            
            if 'volume' in feature_types:
                df = self._create_volume_features(df)
            
            if 'indicators' in feature_types:
                df = self._create_technical_indicators(df)
            
            if 'statistical' in feature_types:
                df = self._create_statistical_features(df)
            
            if 'time' in feature_types:
                df = self._create_time_features(df)
            
            if 'microstructure' in feature_types:
                df = self._create_microstructure_features(df)
            
            # Clean features
            df = self._clean_features(df)
            
            logger.info(f"Created {len(df.columns)} features from {len(data)} samples")
            return df
            
        except Exception as e:
            logger.error(f"Feature engineering error: {e}")
            return data.copy()
    
    def _validate_data(self, data: pd.DataFrame) -> bool:
        """Validate input data quality"""
        required_columns = ['open', 'high', 'low', 'close']
        
        if not all(col in data.columns for col in required_columns):
            return False
        
        if len(data) < 10:  # Minimum samples needed
            return False
        
        if data[required_columns].isnull().sum().sum() > len(data) * 0.1:
            return False  # Too many missing values
        
        return True
    
    def _create_price_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create price-based features"""
        try:
            # Basic price features
            df['returns'] = df['close'].pct_change()
            df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
            df['price_change'] = df['close'] - df['open']
            df['price_change_pct'] = (df['close'] - df['open']) / df['open']
            
            # OHLC relationships
            df['high_low_ratio'] = df['high'] / df['low']
            df['close_open_ratio'] = df['close'] / df['open']
            df['high_close_ratio'] = df['high'] / df['close']
            df['low_close_ratio'] = df['low'] / df['close']
            
            # Body and shadow analysis
            df['body_size'] = abs(df['close'] - df['open'])
            df['upper_shadow'] = df['high'] - np.maximum(df['open'], df['close'])
            df['lower_shadow'] = np.minimum(df['open'], df['close']) - df['low']
            df['total_range'] = df['high'] - df['low']
            
            # Normalized features
            df['body_range_ratio'] = df['body_size'] / df['total_range']
            df['upper_shadow_ratio'] = df['upper_shadow'] / df['total_range']
            df['lower_shadow_ratio'] = df['lower_shadow'] / df['total_range']
            
            # Gap analysis
            df['gap'] = df['open'] - df['close'].shift(1)
            df['gap_pct'] = df['gap'] / df['close'].shift(1)
            
            # Price position within range
            df['close_position'] = (df['close'] - df['low']) / (df['high'] - df['low'])
            
            return df
            
        except Exception as e:
            logger.error(f"Price feature creation error: {e}")
            return df
    
    def _create_volume_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create volume-based features"""
        try:
            if 'volume' not in df.columns:
                # Create dummy volume if not available
                df['volume'] = 1.0
            
            # Basic volume features
            df['volume_sma_5'] = df['volume'].rolling(window=5).mean()
            df['volume_sma_20'] = df['volume'].rolling(window=20).mean()
            df['volume_ratio'] = df['volume'] / df['volume_sma_20']
            
            # Volume-price relationships
            df['volume_price_trend'] = df['volume'] * df['returns']
            df['price_volume_ratio'] = df['close'] / df['volume']
            
            # Volume momentum
            df['volume_change'] = df['volume'].pct_change()
            df['volume_acceleration'] = df['volume_change'].diff()
            
            # Volume moving averages
            for window in [10, 50, 200]:
                df[f'volume_ma_{window}'] = df['volume'].rolling(window=window).mean()
                df[f'volume_ratio_{window}'] = df['volume'] / df[f'volume_ma_{window}']
            
            # On-Balance Volume components
            df['obv_signal'] = np.where(df['close'] > df['close'].shift(1), 1,
                                      np.where(df['close'] < df['close'].shift(1), -1, 0))
            df['volume_direction'] = df['volume'] * df['obv_signal']
            
            return df
            
        except Exception as e:
            logger.error(f"Volume feature creation error: {e}")
            return df
    
    def _create_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create technical indicator features"""
        try:
            # Trend indicators
            for period in [10, 20, 50, 100, 200]:
                df[f'sma_{period}'] = df['close'].rolling(window=period).mean()
                df[f'ema_{period}'] = df['close'].ewm(span=period).mean()
                df[f'price_sma_{period}_ratio'] = df['close'] / df[f'sma_{period}']
                df[f'price_ema_{period}_ratio'] = df['close'] / df[f'ema_{period}']
            
            # MACD
            macd_line, macd_signal, macd_histogram = ta.trend.MACD(df['close']).macd(), \
                                                   ta.trend.MACD(df['close']).macd_signal(), \
                                                   ta.trend.MACD(df['close']).macd_diff()
            df['macd'] = macd_line
            df['macd_signal'] = macd_signal
            df['macd_histogram'] = macd_histogram
            df['macd_signal_line_diff'] = macd_line - macd_signal
            
            # RSI
            for period in [14, 21, 30]:
                df[f'rsi_{period}'] = ta.momentum.RSIIndicator(df['close'], window=period).rsi()
                df[f'rsi_{period}_overbought'] = (df[f'rsi_{period}'] > 70).astype(int)
                df[f'rsi_{period}_oversold'] = (df[f'rsi_{period}'] < 30).astype(int)
            
            # Bollinger Bands
            for period in [20, 50]:
                bb = ta.volatility.BollingerBands(df['close'], window=period)
                df[f'bb_upper_{period}'] = bb.bollinger_hband()
                df[f'bb_lower_{period}'] = bb.bollinger_lband()
                df[f'bb_middle_{period}'] = bb.bollinger_mavg()
                df[f'bb_width_{period}'] = (df[f'bb_upper_{period}'] - df[f'bb_lower_{period}']) / df[f'bb_middle_{period}']
                df[f'bb_position_{period}'] = (df['close'] - df[f'bb_lower_{period}']) / (df[f'bb_upper_{period}'] - df[f'bb_lower_{period}'])
            
            # Stochastic Oscillator
            stoch = ta.momentum.StochasticOscillator(df['high'], df['low'], df['close'])
            df['stoch_k'] = stoch.stoch()
            df['stoch_d'] = stoch.stoch_signal()
            df['stoch_k_d_diff'] = df['stoch_k'] - df['stoch_d']
            
            # Williams %R
            df['williams_r'] = ta.momentum.WilliamsRIndicator(df['high'], df['low'], df['close']).williams_r()
            
            # ATR (Average True Range)
            for period in [14, 21]:
                df[f'atr_{period}'] = ta.volatility.AverageTrueRange(df['high'], df['low'], df['close'], window=period).average_true_range()
                df[f'atr_{period}_ratio'] = df[f'atr_{period}'] / df['close']
            
            # ADX (Average Directional Index)
            df['adx'] = ta.trend.ADXIndicator(df['high'], df['low'], df['close']).adx()
            df['adx_pos'] = ta.trend.ADXIndicator(df['high'], df['low'], df['close']).adx_pos()
            df['adx_neg'] = ta.trend.ADXIndicator(df['high'], df['low'], df['close']).adx_neg()
            
            # CCI (Commodity Channel Index)
            df['cci'] = ta.trend.CCIIndicator(df['high'], df['low'], df['close']).cci()
            
            # Money Flow Index
            if 'volume' in df.columns:
                df['mfi'] = ta.volume.MFIIndicator(df['high'], df['low'], df['close'], df['volume']).money_flow_index()
            
            # Parabolic SAR
            df['psar'] = ta.trend.PSARIndicator(df['high'], df['low'], df['close']).psar()
            df['psar_signal'] = np.where(df['close'] > df['psar'], 1, -1)
            
            return df
            
        except Exception as e:
            logger.error(f"Technical indicator creation error: {e}")
            return df
    
    def _create_statistical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create statistical features"""
        try:
            # Rolling statistics
            for window in [5, 10, 20, 50]:
                # Price statistics
                df[f'close_mean_{window}'] = df['close'].rolling(window=window).mean()
                df[f'close_std_{window}'] = df['close'].rolling(window=window).std()
                df[f'close_var_{window}'] = df['close'].rolling(window=window).var()
                df[f'close_skew_{window}'] = df['close'].rolling(window=window).skew()
                df[f'close_kurt_{window}'] = df['close'].rolling(window=window).kurt()
                
                # Return statistics
                df[f'returns_mean_{window}'] = df['returns'].rolling(window=window).mean()
                df[f'returns_std_{window}'] = df['returns'].rolling(window=window).std()
                df[f'returns_skew_{window}'] = df['returns'].rolling(window=window).skew()
                df[f'returns_kurt_{window}'] = df['returns'].rolling(window=window).kurt()
                
                # Z-scores
                df[f'close_zscore_{window}'] = (df['close'] - df[f'close_mean_{window}']) / df[f'close_std_{window}']
                df[f'returns_zscore_{window}'] = (df['returns'] - df[f'returns_mean_{window}']) / df[f'returns_std_{window}']
                
                # Percentile ranks
                df[f'close_percentile_{window}'] = df['close'].rolling(window=window).rank(pct=True)
                df[f'volume_percentile_{window}'] = df.get('volume', pd.Series(1, index=df.index)).rolling(window=window).rank(pct=True)
            
            # Volatility measures
            df['volatility_parkinson'] = np.sqrt(252) * np.sqrt(np.log(df['high'] / df['low']) ** 2)
            df['volatility_garman_klass'] = np.sqrt(252) * np.sqrt(
                0.5 * (np.log(df['high'] / df['low']) ** 2) - 
                (2 * np.log(2) - 1) * (np.log(df['close'] / df['open']) ** 2)
            )
            
            # Range-based features
            for window in [5, 20]:
                df[f'high_low_range_{window}'] = df['high'].rolling(window=window).max() - df['low'].rolling(window=window).min()
                df[f'close_range_position_{window}'] = (df['close'] - df['low'].rolling(window=window).min()) / df[f'high_low_range_{window}']
            
            # Momentum features
            for period in [1, 3, 5, 10, 20]:
                df[f'momentum_{period}'] = df['close'] / df['close'].shift(period) - 1
                df[f'roc_{period}'] = df['close'].pct_change(periods=period)
            
            # Lag features
            for lag in [1, 2, 3, 5, 10]:
                df[f'close_lag_{lag}'] = df['close'].shift(lag)
                df[f'returns_lag_{lag}'] = df['returns'].shift(lag)
                df[f'volume_lag_{lag}'] = df.get('volume', pd.Series(1, index=df.index)).shift(lag)
            
            return df
            
        except Exception as e:
            logger.error(f"Statistical feature creation error: {e}")
            return df
    
    def _create_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create time-based features"""
        try:
            if isinstance(df.index, pd.DatetimeIndex):
                # Time components
                df['hour'] = df.index.hour
                df['day_of_week'] = df.index.dayofweek
                df['day_of_month'] = df.index.day
                df['month'] = df.index.month
                df['quarter'] = df.index.quarter
                df['year'] = df.index.year
                
                # Cyclical encoding
                df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
                df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
                df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
                df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
                df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
                df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
                
                # Trading session indicators
                df['asian_session'] = ((df['hour'] >= 0) & (df['hour'] < 8)).astype(int)
                df['london_session'] = ((df['hour'] >= 8) & (df['hour'] < 16)).astype(int)
                df['ny_session'] = ((df['hour'] >= 13) & (df['hour'] < 21)).astype(int)
                df['overlap_london_ny'] = ((df['hour'] >= 13) & (df['hour'] < 16)).astype(int)
                
                # Weekend/holiday indicators
                df['is_weekend'] = (df['day_of_week'].isin([5, 6])).astype(int)
                df['is_month_end'] = (df.index.is_month_end).astype(int)
                df['is_month_start'] = (df.index.is_month_start).astype(int)
                df['is_quarter_end'] = (df.index.is_quarter_end).astype(int)
                
            else:
                # If no datetime index, create dummy time features
                df['hour'] = 12  # Assume noon
                df['day_of_week'] = 2  # Assume Wednesday
                df['month'] = 6  # Assume June
                
                # Dummy cyclical features
                for feature in ['hour_sin', 'hour_cos', 'day_of_week_sin', 'day_of_week_cos', 
                              'month_sin', 'month_cos']:
                    df[feature] = 0.0
                
                # Dummy session indicators
                for feature in ['asian_session', 'london_session', 'ny_session', 
                              'overlap_london_ny', 'is_weekend', 'is_month_end', 
                              'is_month_start', 'is_quarter_end']:
                    df[feature] = 0
            
            return df
            
        except Exception as e:
            logger.error(f"Time feature creation error: {e}")
            return df
    
    def _create_microstructure_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create market microstructure features"""
        try:
            # Price impact and efficiency measures
            df['price_efficiency'] = abs(df['returns']) / df.get('volume', pd.Series(1, index=df.index))
            
            # Bid-ask spread proxy (using high-low range)
            df['spread_proxy'] = (df['high'] - df['low']) / df['close']
            df['spread_ma_5'] = df['spread_proxy'].rolling(window=5).mean()
            df['spread_ratio'] = df['spread_proxy'] / df['spread_ma_5']
            
            # Order flow proxy
            df['buying_pressure'] = (df['close'] - df['low']) / (df['high'] - df['low'])
            df['selling_pressure'] = (df['high'] - df['close']) / (df['high'] - df['low'])
            
            # Tick direction (approximation)
            df['tick_direction'] = np.where(df['close'] > df['close'].shift(1), 1,
                                          np.where(df['close'] < df['close'].shift(1), -1, 0))
            df['tick_imbalance'] = df['tick_direction'].rolling(window=10).sum()
            
            # Volume-weighted price measures
            if 'volume' in df.columns:
                df['vwap_proxy'] = (df['high'] + df['low'] + df['close']) / 3  # Typical price
                df['volume_weighted_return'] = df['returns'] * df['volume']
            
            # Liquidity proxies
            df['illiquidity_proxy'] = abs(df['returns']) / df.get('volume', pd.Series(1, index=df.index))
            df['turnover_proxy'] = df.get('volume', pd.Series(1, index=df.index)) / df['close']
            
            return df
            
        except Exception as e:
            logger.error(f"Microstructure feature creation error: {e}")
            return df
    
    def _clean_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate features"""
        try:
            # Remove infinite values
            df = df.replace([np.inf, -np.inf], np.nan)
            
            # Fill NaN values
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            
            # Forward fill first, then backward fill
            df[numeric_columns] = df[numeric_columns].fillna(method='ffill').fillna(method='bfill')
            
            # Fill any remaining NaN with zeros
            df[numeric_columns] = df[numeric_columns].fillna(0)
            
            # Remove columns with all zeros or constants
            constant_columns = []
            for col in numeric_columns:
                if df[col].nunique() <= 1:
                    constant_columns.append(col)
            
            if constant_columns:
                logger.info(f"Removing {len(constant_columns)} constant columns")
                df = df.drop(columns=constant_columns)
            
            # Cap extreme outliers (beyond 5 standard deviations)
            for col in df.select_dtypes(include=[np.number]).columns:
                if df[col].std() > 0:
                    mean_val = df[col].mean()
                    std_val = df[col].std()
                    lower_bound = mean_val - 5 * std_val
                    upper_bound = mean_val + 5 * std_val
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
            
            return df
            
        except Exception as e:
            logger.error(f"Feature cleaning error: {e}")
            return df
    
    def scale_features(self, df: pd.DataFrame, method: str = 'standard') -> pd.DataFrame:
        """Scale features for ML models"""
        try:
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            
            if method == 'standard':
                scaler = StandardScaler()
            elif method == 'robust':
                scaler = RobustScaler()
            else:
                logger.warning(f"Unknown scaling method: {method}. Using standard scaling.")
                scaler = StandardScaler()
            
            df_scaled = df.copy()
            df_scaled[numeric_columns] = scaler.fit_transform(df[numeric_columns])
            
            # Store scaler for future use
            self.scalers[method] = scaler
            
            return df_scaled
            
        except Exception as e:
            logger.error(f"Feature scaling error: {e}")
            return df
    
    def select_features(self, df: pd.DataFrame, target_col: str, 
                       method: str = 'correlation', top_k: int = 50) -> List[str]:
        """Select most important features"""
        try:
            if target_col not in df.columns:
                logger.error(f"Target column {target_col} not found")
                return list(df.columns)
            
            feature_cols = [col for col in df.columns if col != target_col]
            
            if method == 'correlation':
                # Select features based on correlation with target
                correlations = abs(df[feature_cols].corrwith(df[target_col]))
                selected_features = correlations.nlargest(top_k).index.tolist()
                
            elif method == 'variance':
                # Select features with highest variance
                variances = df[feature_cols].var()
                selected_features = variances.nlargest(top_k).index.tolist()
                
            else:
                # Return all features
                selected_features = feature_cols[:top_k]
            
            logger.info(f"Selected {len(selected_features)} features using {method} method")
            return selected_features
            
        except Exception as e:
            logger.error(f"Feature selection error: {e}")
            return list(df.columns)
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        return self.feature_importance.copy()
    
    def update_feature_importance(self, importance_dict: Dict[str, float]):
        """Update feature importance scores"""
        self.feature_importance.update(importance_dict)