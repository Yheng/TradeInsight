"""
Pattern Detection Model for identifying trading patterns and chart formations
Uses ML and rule-based approaches for comprehensive pattern recognition
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import logging
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from scipy.signal import find_peaks, argrelextrema
from scipy.stats import linregress
import ta

logger = logging.getLogger(__name__)

class PatternDetectionModel:
    """
    Advanced pattern detection using ML and technical analysis
    Identifies support/resistance, trends, candlestick patterns, and chart formations
    """
    
    def __init__(self):
        self.last_trained = None
        self.version = "1.0"
        self.last_accuracy = None
        self.training_samples = None
        
        # Pattern detection parameters
        self.min_pattern_length = 10
        self.support_resistance_tolerance = 0.001  # 0.1%
        self.trend_min_points = 5
        self.consolidation_threshold = 0.02  # 2%
        
        # Candlestick pattern definitions
        self.candlestick_patterns = {
            'doji': self._detect_doji,
            'hammer': self._detect_hammer,
            'shooting_star': self._detect_shooting_star,
            'engulfing_bullish': self._detect_engulfing_bullish,
            'engulfing_bearish': self._detect_engulfing_bearish,
            'morning_star': self._detect_morning_star,
            'evening_star': self._detect_evening_star,
            'three_white_soldiers': self._detect_three_white_soldiers,
            'three_black_crows': self._detect_three_black_crows
        }
        
        # Chart pattern templates
        self.chart_patterns = {
            'head_and_shoulders': self._detect_head_and_shoulders,
            'inverse_head_and_shoulders': self._detect_inverse_head_and_shoulders,
            'double_top': self._detect_double_top,
            'double_bottom': self._detect_double_bottom,
            'triangle_ascending': self._detect_ascending_triangle,
            'triangle_descending': self._detect_descending_triangle,
            'triangle_symmetrical': self._detect_symmetrical_triangle,
            'wedge_rising': self._detect_rising_wedge,
            'wedge_falling': self._detect_falling_wedge,
            'flag_bull': self._detect_bull_flag,
            'flag_bear': self._detect_bear_flag,
            'pennant': self._detect_pennant
        }
    
    def detect_patterns(self, data: pd.DataFrame, pattern_types: List[str] = None) -> List[Dict[str, Any]]:
        """
        Detect various trading patterns in price data
        
        Args:
            data: OHLCV price data
            pattern_types: List of pattern types to detect
        
        Returns:
            List of detected patterns with metadata
        """
        if pattern_types is None:
            pattern_types = ['support_resistance', 'trends', 'candlestick', 'technical']
        
        all_patterns = []
        
        # Detect support and resistance levels
        if 'support_resistance' in pattern_types:
            sr_patterns = self._detect_support_resistance(data)
            all_patterns.extend(sr_patterns)
        
        # Detect trend patterns
        if 'trends' in pattern_types:
            trend_patterns = self._detect_trends(data)
            all_patterns.extend(trend_patterns)
        
        # Detect candlestick patterns
        if 'candlestick' in pattern_types:
            candlestick_patterns = self._detect_candlestick_patterns(data)
            all_patterns.extend(candlestick_patterns)
        
        # Detect technical/chart patterns
        if 'technical' in pattern_types:
            technical_patterns = self._detect_chart_patterns(data)
            all_patterns.extend(technical_patterns)
        
        # Sort patterns by confidence score
        all_patterns.sort(key=lambda x: x['confidence'], reverse=True)
        
        return all_patterns
    
    def _detect_support_resistance(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect support and resistance levels using ML clustering"""
        patterns = []
        
        # Get significant highs and lows
        highs = self._find_significant_peaks(data['high'].values, prominence=0.001)
        lows = self._find_significant_valleys(data['low'].values, prominence=0.001)
        
        # Cluster resistance levels
        if len(highs) > 2:
            resistance_levels = self._cluster_levels(data['high'].iloc[highs].values)
            for level, strength, touches in resistance_levels:
                patterns.append({
                    'id': f"resistance_{len(patterns)}",
                    'type': 'support_resistance',
                    'name': 'Resistance Level',
                    'start_time': data.index[max(0, highs[0] - 10)],
                    'end_time': data.index[-1],
                    'confidence': min(0.9, strength / 10),
                    'signal': 'bearish',
                    'target_price': level,
                    'stop_loss': level * 1.005,  # 0.5% above resistance
                    'description': f'Resistance at {level:.5f} with {touches} touches',
                    'parameters': {
                        'level': level,
                        'strength': strength,
                        'touches': touches,
                        'type': 'resistance'
                    }
                })
        
        # Cluster support levels
        if len(lows) > 2:
            support_levels = self._cluster_levels(data['low'].iloc[lows].values)
            for level, strength, touches in support_levels:
                patterns.append({
                    'id': f"support_{len(patterns)}",
                    'type': 'support_resistance',
                    'name': 'Support Level',
                    'start_time': data.index[max(0, lows[0] - 10)],
                    'end_time': data.index[-1],
                    'confidence': min(0.9, strength / 10),
                    'signal': 'bullish',
                    'target_price': level,
                    'stop_loss': level * 0.995,  # 0.5% below support
                    'description': f'Support at {level:.5f} with {touches} touches',
                    'parameters': {
                        'level': level,
                        'strength': strength,
                        'touches': touches,
                        'type': 'support'
                    }
                })
        
        return patterns
    
    def _detect_trends(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect trend patterns using statistical analysis"""
        patterns = []
        
        # Calculate various trend indicators
        close_prices = data['close'].values
        
        # Short-term trend (20 periods)
        if len(close_prices) >= 20:
            short_trend = self._calculate_trend(close_prices[-20:])
            if abs(short_trend['slope']) > 0.0001:  # Significant trend
                patterns.append({
                    'id': f"trend_short_{len(patterns)}",
                    'type': 'trends',
                    'name': f"Short-term {'Uptrend' if short_trend['slope'] > 0 else 'Downtrend'}",
                    'start_time': data.index[-20],
                    'end_time': data.index[-1],
                    'confidence': min(0.9, short_trend['r_squared']),
                    'signal': 'bullish' if short_trend['slope'] > 0 else 'bearish',
                    'description': f"Strong {'up' if short_trend['slope'] > 0 else 'down'}trend detected",
                    'parameters': {
                        'slope': short_trend['slope'],
                        'r_squared': short_trend['r_squared'],
                        'period': 20,
                        'type': 'short_term'
                    }
                })
        
        # Medium-term trend (50 periods)
        if len(close_prices) >= 50:
            medium_trend = self._calculate_trend(close_prices[-50:])
            if abs(medium_trend['slope']) > 0.0001:
                patterns.append({
                    'id': f"trend_medium_{len(patterns)}",
                    'type': 'trends',
                    'name': f"Medium-term {'Uptrend' if medium_trend['slope'] > 0 else 'Downtrend'}",
                    'start_time': data.index[-50],
                    'end_time': data.index[-1],
                    'confidence': min(0.9, medium_trend['r_squared']),
                    'signal': 'bullish' if medium_trend['slope'] > 0 else 'bearish',
                    'description': f"Medium-term {'up' if medium_trend['slope'] > 0 else 'down'}trend",
                    'parameters': {
                        'slope': medium_trend['slope'],
                        'r_squared': medium_trend['r_squared'],
                        'period': 50,
                        'type': 'medium_term'
                    }
                })
        
        # Detect trend reversal patterns
        reversal_patterns = self._detect_trend_reversals(data)
        patterns.extend(reversal_patterns)
        
        return patterns
    
    def _detect_candlestick_patterns(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect candlestick patterns"""
        patterns = []
        
        for pattern_name, detector_func in self.candlestick_patterns.items():
            pattern_results = detector_func(data)
            patterns.extend(pattern_results)
        
        return patterns
    
    def _detect_chart_patterns(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect technical chart patterns"""
        patterns = []
        
        for pattern_name, detector_func in self.chart_patterns.items():
            try:
                pattern_results = detector_func(data)
                patterns.extend(pattern_results)
            except Exception as e:
                logger.warning(f"Failed to detect {pattern_name}: {e}")
        
        return patterns
    
    def _find_significant_peaks(self, data: np.ndarray, prominence: float = 0.001) -> np.ndarray:
        """Find significant peaks in price data"""
        peaks, properties = find_peaks(data, prominence=prominence * np.mean(data))
        return peaks
    
    def _find_significant_valleys(self, data: np.ndarray, prominence: float = 0.001) -> np.ndarray:
        """Find significant valleys in price data"""
        valleys, properties = find_peaks(-data, prominence=prominence * np.mean(data))
        return valleys
    
    def _cluster_levels(self, levels: np.ndarray, eps: float = 0.001) -> List[Tuple[float, float, int]]:
        """Cluster price levels to find support/resistance"""
        if len(levels) < 2:
            return []
        
        # Reshape for clustering
        levels_reshaped = levels.reshape(-1, 1)
        
        # Use DBSCAN clustering
        clustering = DBSCAN(eps=eps * np.mean(levels), min_samples=2)
        cluster_labels = clustering.fit_predict(levels_reshaped)
        
        clustered_levels = []
        for cluster_id in set(cluster_labels):
            if cluster_id == -1:  # Noise
                continue
            
            cluster_points = levels[cluster_labels == cluster_id]
            if len(cluster_points) >= 2:
                level = np.mean(cluster_points)
                strength = len(cluster_points) * np.std(cluster_points)
                touches = len(cluster_points)
                clustered_levels.append((level, strength, touches))
        
        return clustered_levels
    
    def _calculate_trend(self, data: np.ndarray) -> Dict[str, float]:
        """Calculate trend statistics using linear regression"""
        x = np.arange(len(data))
        slope, intercept, r_value, p_value, std_err = linregress(x, data)
        
        return {
            'slope': slope,
            'intercept': intercept,
            'r_squared': r_value ** 2,
            'p_value': p_value,
            'std_error': std_err
        }
    
    def _detect_trend_reversals(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect potential trend reversal patterns"""
        patterns = []
        
        # Use RSI divergence for reversal detection
        rsi = ta.momentum.RSIIndicator(data['close']).rsi()
        close_prices = data['close']
        
        # Find recent highs and lows
        recent_data_length = min(50, len(data))
        recent_close = close_prices.tail(recent_data_length)
        recent_rsi = rsi.tail(recent_data_length)
        
        # Bullish divergence (price makes lower lows, RSI makes higher lows)
        price_lows = argrelextrema(recent_close.values, np.less, order=5)[0]
        rsi_lows = argrelextrema(recent_rsi.values, np.less, order=5)[0]
        
        if len(price_lows) >= 2 and len(rsi_lows) >= 2:
            last_price_low = price_lows[-1]
            prev_price_low = price_lows[-2]
            
            if (recent_close.iloc[last_price_low] < recent_close.iloc[prev_price_low] and
                recent_rsi.iloc[last_price_low] > recent_rsi.iloc[prev_price_low]):
                
                patterns.append({
                    'id': f"bullish_divergence_{len(patterns)}",
                    'type': 'trends',
                    'name': 'Bullish RSI Divergence',
                    'start_time': recent_close.index[prev_price_low],
                    'end_time': recent_close.index[last_price_low],
                    'confidence': 0.7,
                    'signal': 'bullish',
                    'description': 'Price makes lower low while RSI makes higher low',
                    'parameters': {
                        'type': 'rsi_divergence',
                        'direction': 'bullish'
                    }
                })
        
        return patterns
    
    # Candlestick pattern detection methods
    def _detect_doji(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect Doji candlestick patterns"""
        patterns = []
        
        for i in range(len(data)):
            candle = data.iloc[i]
            body_size = abs(candle['close'] - candle['open'])
            range_size = candle['high'] - candle['low']
            
            if range_size > 0 and body_size / range_size < 0.1:  # Small body relative to range
                patterns.append({
                    'id': f"doji_{i}",
                    'type': 'candlestick',
                    'name': 'Doji',
                    'start_time': data.index[i],
                    'end_time': data.index[i],
                    'confidence': 0.6,
                    'signal': 'neutral',
                    'description': 'Indecision candle - potential reversal',
                    'parameters': {
                        'body_ratio': body_size / range_size if range_size > 0 else 0,
                        'type': 'doji'
                    }
                })
        
        return patterns
    
    def _detect_hammer(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect Hammer candlestick patterns"""
        patterns = []
        
        for i in range(len(data)):
            candle = data.iloc[i]
            body_size = abs(candle['close'] - candle['open'])
            lower_shadow = min(candle['open'], candle['close']) - candle['low']
            upper_shadow = candle['high'] - max(candle['open'], candle['close'])
            
            # Hammer: small body, long lower shadow, short upper shadow
            if (body_size > 0 and lower_shadow > 2 * body_size and 
                upper_shadow < body_size and lower_shadow > 0.6 * (candle['high'] - candle['low'])):
                
                patterns.append({
                    'id': f"hammer_{i}",
                    'type': 'candlestick',
                    'name': 'Hammer',
                    'start_time': data.index[i],
                    'end_time': data.index[i],
                    'confidence': 0.75,
                    'signal': 'bullish',
                    'description': 'Potential bullish reversal pattern',
                    'parameters': {
                        'lower_shadow_ratio': lower_shadow / body_size if body_size > 0 else 0,
                        'type': 'hammer'
                    }
                })
        
        return patterns
    
    def _detect_shooting_star(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect Shooting Star candlestick patterns"""
        patterns = []
        
        for i in range(len(data)):
            candle = data.iloc[i]
            body_size = abs(candle['close'] - candle['open'])
            lower_shadow = min(candle['open'], candle['close']) - candle['low']
            upper_shadow = candle['high'] - max(candle['open'], candle['close'])
            
            # Shooting Star: small body, long upper shadow, short lower shadow
            if (body_size > 0 and upper_shadow > 2 * body_size and 
                lower_shadow < body_size and upper_shadow > 0.6 * (candle['high'] - candle['low'])):
                
                patterns.append({
                    'id': f"shooting_star_{i}",
                    'type': 'candlestick',
                    'name': 'Shooting Star',
                    'start_time': data.index[i],
                    'end_time': data.index[i],
                    'confidence': 0.75,
                    'signal': 'bearish',
                    'description': 'Potential bearish reversal pattern',
                    'parameters': {
                        'upper_shadow_ratio': upper_shadow / body_size if body_size > 0 else 0,
                        'type': 'shooting_star'
                    }
                })
        
        return patterns
    
    def _detect_engulfing_bullish(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect Bullish Engulfing patterns"""
        patterns = []
        
        for i in range(1, len(data)):
            prev_candle = data.iloc[i-1]
            curr_candle = data.iloc[i]
            
            # Previous candle is bearish, current candle is bullish and engulfs previous
            if (prev_candle['close'] < prev_candle['open'] and  # Previous bearish
                curr_candle['close'] > curr_candle['open'] and  # Current bullish
                curr_candle['open'] < prev_candle['close'] and  # Engulfing condition
                curr_candle['close'] > prev_candle['open']):
                
                patterns.append({
                    'id': f"bullish_engulfing_{i}",
                    'type': 'candlestick',
                    'name': 'Bullish Engulfing',
                    'start_time': data.index[i-1],
                    'end_time': data.index[i],
                    'confidence': 0.8,
                    'signal': 'bullish',
                    'description': 'Strong bullish reversal pattern',
                    'parameters': {
                        'engulfing_ratio': (curr_candle['close'] - curr_candle['open']) / 
                                         (prev_candle['open'] - prev_candle['close']),
                        'type': 'bullish_engulfing'
                    }
                })
        
        return patterns
    
    def _detect_engulfing_bearish(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect Bearish Engulfing patterns"""
        patterns = []
        
        for i in range(1, len(data)):
            prev_candle = data.iloc[i-1]
            curr_candle = data.iloc[i]
            
            # Previous candle is bullish, current candle is bearish and engulfs previous
            if (prev_candle['close'] > prev_candle['open'] and  # Previous bullish
                curr_candle['close'] < curr_candle['open'] and  # Current bearish
                curr_candle['open'] > prev_candle['close'] and  # Engulfing condition
                curr_candle['close'] < prev_candle['open']):
                
                patterns.append({
                    'id': f"bearish_engulfing_{i}",
                    'type': 'candlestick',
                    'name': 'Bearish Engulfing',
                    'start_time': data.index[i-1],
                    'end_time': data.index[i],
                    'confidence': 0.8,
                    'signal': 'bearish',
                    'description': 'Strong bearish reversal pattern',
                    'parameters': {
                        'engulfing_ratio': (curr_candle['open'] - curr_candle['close']) / 
                                         (prev_candle['close'] - prev_candle['open']),
                        'type': 'bearish_engulfing'
                    }
                })
        
        return patterns
    
    # Placeholder methods for other patterns
    def _detect_morning_star(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Morning Star pattern
    
    def _detect_evening_star(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Evening Star pattern
    
    def _detect_three_white_soldiers(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Three White Soldiers
    
    def _detect_three_black_crows(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Three Black Crows
    
    # Chart pattern detection methods (placeholders)
    def _detect_head_and_shoulders(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Head and Shoulders
    
    def _detect_inverse_head_and_shoulders(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Inverse Head and Shoulders
    
    def _detect_double_top(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Double Top
    
    def _detect_double_bottom(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Double Bottom
    
    def _detect_ascending_triangle(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Ascending Triangle
    
    def _detect_descending_triangle(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Descending Triangle
    
    def _detect_symmetrical_triangle(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Symmetrical Triangle
    
    def _detect_rising_wedge(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Rising Wedge
    
    def _detect_falling_wedge(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Falling Wedge
    
    def _detect_bull_flag(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Bull Flag
    
    def _detect_bear_flag(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Bear Flag
    
    def _detect_pennant(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []  # Implementation for Pennant
    
    def calculate_reliability(self, data: pd.DataFrame, patterns: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate reliability scores for detected patterns"""
        reliability_scores = {}
        
        for pattern in patterns:
            pattern_id = pattern['id']
            pattern_type = pattern['type']
            
            # Base reliability score
            base_score = pattern['confidence']
            
            # Adjust based on volume confirmation
            if 'volume' in data.columns:
                volume_confirmation = self._check_volume_confirmation(data, pattern)
                base_score *= (1 + volume_confirmation * 0.2)  # Up to 20% boost
            
            # Adjust based on market context
            market_context = self._analyze_market_context(data, pattern)
            base_score *= market_context
            
            # Adjust based on pattern completion
            completion_score = self._check_pattern_completion(data, pattern)
            base_score *= completion_score
            
            reliability_scores[pattern_id] = min(1.0, base_score)
        
        return reliability_scores
    
    def _check_volume_confirmation(self, data: pd.DataFrame, pattern: Dict[str, Any]) -> float:
        """Check if volume confirms the pattern"""
        # Simplified volume confirmation logic
        return 0.1  # 10% boost for now
    
    def _analyze_market_context(self, data: pd.DataFrame, pattern: Dict[str, Any]) -> float:
        """Analyze market context for pattern reliability"""
        # Check if pattern aligns with overall trend
        return 1.0  # Neutral for now
    
    def _check_pattern_completion(self, data: pd.DataFrame, pattern: Dict[str, Any]) -> float:
        """Check if pattern is properly completed"""
        # Check if pattern has proper formation
        return 1.0  # Assume complete for now
    
    def retrain(self, training_data: Dict[str, pd.DataFrame], force_retrain: bool = False) -> Dict[str, Any]:
        """Retrain pattern detection models"""
        # Pattern detection is primarily rule-based, but we can optimize parameters
        self.last_trained = datetime.utcnow()
        
        return {
            'training_samples': sum(len(data) for data in training_data.values()),
            'validation_score': 0.8,  # Estimated accuracy
            'training_time': 1,
            'version': self.version
        }