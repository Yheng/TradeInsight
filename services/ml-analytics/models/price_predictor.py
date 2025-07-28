"""
Advanced Price Prediction Model using multiple ML algorithms
Combines LSTM, Random Forest, and XGBoost for robust predictions
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import logging
import joblib
import os

# ML libraries
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import lightgbm as lgb
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import optuna

# Technical analysis
import ta

logger = logging.getLogger(__name__)

class PricePredictionModel:
    """
    Advanced price prediction model using ensemble methods
    Combines multiple algorithms for robust market predictions
    """
    
    def __init__(self, model_dir: str = 'saved_models'):
        self.model_dir = model_dir
        self.models = {}
        self.scalers = {}
        self.feature_columns = []
        self.last_trained = None
        self.version = "1.0"
        self.last_accuracy = None
        self.training_samples = None
        
        # Model hyperparameters
        self.hyperparameters = {
            'lstm': {
                'sequence_length': 60,
                'units': [100, 50, 25],
                'dropout': 0.2,
                'epochs': 100,
                'batch_size': 32
            },
            'random_forest': {
                'n_estimators': 200,
                'max_depth': 15,
                'min_samples_split': 5,
                'min_samples_leaf': 2
            },
            'xgboost': {
                'n_estimators': 200,
                'max_depth': 6,
                'learning_rate': 0.1,
                'subsample': 0.8
            },
            'lightgbm': {
                'n_estimators': 200,
                'max_depth': 6,
                'learning_rate': 0.1,
                'feature_fraction': 0.8
            }
        }
        
        # Ensemble weights (optimized through validation)
        self.ensemble_weights = {
            'lstm': 0.4,
            'xgboost': 0.3,
            'lightgbm': 0.2,
            'random_forest': 0.1
        }
        
        # Create model directory
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Load existing models if available
        self._load_models()
    
    def _create_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create comprehensive feature set for price prediction"""
        df = data.copy()
        
        # Basic price features
        df['returns'] = df['close'].pct_change()
        df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
        df['price_change'] = df['close'] - df['open']
        df['high_low_ratio'] = df['high'] / df['low']
        df['volume_price_trend'] = df['volume'] * df['returns']
        
        # Moving averages
        for period in [5, 10, 20, 50, 100, 200]:
            df[f'ma_{period}'] = df['close'].rolling(window=period).mean()
            df[f'ma_{period}_ratio'] = df['close'] / df[f'ma_{period}']
        
        # Volatility features
        df['volatility_10'] = df['returns'].rolling(window=10).std()
        df['volatility_20'] = df['returns'].rolling(window=20).std()
        df['volatility_50'] = df['returns'].rolling(window=50).std()
        
        # Technical indicators using ta library
        df['rsi'] = ta.momentum.RSIIndicator(df['close']).rsi()
        df['macd'] = ta.trend.MACD(df['close']).macd()
        df['macd_signal'] = ta.trend.MACD(df['close']).macd_signal()
        df['macd_histogram'] = ta.trend.MACD(df['close']).macd_diff()
        
        # Bollinger Bands
        bb = ta.volatility.BollingerBands(df['close'])
        df['bb_upper'] = bb.bollinger_hband()
        df['bb_lower'] = bb.bollinger_lband()
        df['bb_middle'] = bb.bollinger_mavg()
        df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
        
        # Stochastic oscillator
        stoch = ta.momentum.StochasticOscillator(df['high'], df['low'], df['close'])
        df['stoch_k'] = stoch.stoch()
        df['stoch_d'] = stoch.stoch_signal()
        
        # ATR (Average True Range)
        df['atr'] = ta.volatility.AverageTrueRange(df['high'], df['low'], df['close']).average_true_range()
        
        # Williams %R
        df['williams_r'] = ta.momentum.WilliamsRIndicator(df['high'], df['low'], df['close']).williams_r()
        
        # Commodity Channel Index
        df['cci'] = ta.trend.CCIIndicator(df['high'], df['low'], df['close']).cci()
        
        # Money Flow Index
        df['mfi'] = ta.volume.MFIIndicator(df['high'], df['low'], df['close'], df['volume']).money_flow_index()
        
        # On-Balance Volume
        df['obv'] = ta.volume.OnBalanceVolumeIndicator(df['close'], df['volume']).on_balance_volume()
        
        # Time-based features
        df['hour'] = pd.to_datetime(df.index).hour if isinstance(df.index, pd.DatetimeIndex) else 0
        df['day_of_week'] = pd.to_datetime(df.index).dayofweek if isinstance(df.index, pd.DatetimeIndex) else 0
        df['month'] = pd.to_datetime(df.index).month if isinstance(df.index, pd.DatetimeIndex) else 0
        
        # Lag features
        for lag in [1, 2, 3, 5, 10]:
            df[f'close_lag_{lag}'] = df['close'].shift(lag)
            df[f'volume_lag_{lag}'] = df['volume'].shift(lag)
            df[f'returns_lag_{lag}'] = df['returns'].shift(lag)
        
        # Rolling statistics
        for window in [5, 10, 20]:
            df[f'close_mean_{window}'] = df['close'].rolling(window=window).mean()
            df[f'close_std_{window}'] = df['close'].rolling(window=window).std()
            df[f'volume_mean_{window}'] = df['volume'].rolling(window=window).mean()
            df[f'returns_mean_{window}'] = df['returns'].rolling(window=window).mean()
        
        # Forward fill and drop NaN values
        df = df.fillna(method='ffill').fillna(method='bfill')
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(0)
        
        return df
    
    def _prepare_lstm_data(self, data: pd.DataFrame, sequence_length: int = 60) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for LSTM model"""
        # Scale the data
        if 'lstm_scaler' not in self.scalers:
            self.scalers['lstm_scaler'] = MinMaxScaler()
            scaled_data = self.scalers['lstm_scaler'].fit_transform(data)
        else:
            scaled_data = self.scalers['lstm_scaler'].transform(data)
        
        X, y = [], []
        
        for i in range(sequence_length, len(scaled_data)):
            X.append(scaled_data[i-sequence_length:i])
            y.append(scaled_data[i, 0])  # Assuming 'close' is the first column
        
        return np.array(X), np.array(y)
    
    def _build_lstm_model(self, input_shape: Tuple[int, int]) -> keras.Model:
        """Build LSTM model architecture"""
        model = keras.Sequential([
            layers.LSTM(
                self.hyperparameters['lstm']['units'][0],
                return_sequences=True,
                input_shape=input_shape
            ),
            layers.Dropout(self.hyperparameters['lstm']['dropout']),
            
            layers.LSTM(
                self.hyperparameters['lstm']['units'][1],
                return_sequences=True
            ),
            layers.Dropout(self.hyperparameters['lstm']['dropout']),
            
            layers.LSTM(self.hyperparameters['lstm']['units'][2]),
            layers.Dropout(self.hyperparameters['lstm']['dropout']),
            
            layers.Dense(50, activation='relu'),
            layers.Dense(25, activation='relu'),
            layers.Dense(1)
        ])
        
        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def train(self, training_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Train all models with the provided data"""
        logger.info("Starting model training...")
        
        # Combine all symbol data
        combined_data = pd.concat([
            self._create_features(data) for data in training_data.values()
        ], ignore_index=True)
        
        # Remove target variable to get features
        target_col = 'close'
        feature_cols = [col for col in combined_data.columns if col != target_col]
        
        X = combined_data[feature_cols]
        y = combined_data[target_col]
        
        # Store feature columns
        self.feature_columns = feature_cols
        
        # Split data (80% train, 20% validation)
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        training_results = {}
        
        # Train Random Forest
        logger.info("Training Random Forest...")
        rf_model = RandomForestRegressor(**self.hyperparameters['random_forest'])
        
        # Scale features for tree-based models
        if 'tree_scaler' not in self.scalers:
            self.scalers['tree_scaler'] = StandardScaler()
            X_train_scaled = self.scalers['tree_scaler'].fit_transform(X_train)
        else:
            X_train_scaled = self.scalers['tree_scaler'].transform(X_train)
        
        X_val_scaled = self.scalers['tree_scaler'].transform(X_val)
        
        rf_model.fit(X_train, y_train)  # Random Forest doesn't need scaling
        rf_pred = rf_model.predict(X_val)
        rf_mse = mean_squared_error(y_val, rf_pred)
        rf_r2 = r2_score(y_val, rf_pred)
        
        self.models['random_forest'] = rf_model
        training_results['random_forest'] = {'mse': rf_mse, 'r2': rf_r2}
        
        # Train XGBoost
        logger.info("Training XGBoost...")
        xgb_model = xgb.XGBRegressor(**self.hyperparameters['xgboost'])
        xgb_model.fit(X_train_scaled, y_train)
        xgb_pred = xgb_model.predict(X_val_scaled)
        xgb_mse = mean_squared_error(y_val, xgb_pred)
        xgb_r2 = r2_score(y_val, xgb_pred)
        
        self.models['xgboost'] = xgb_model
        training_results['xgboost'] = {'mse': xgb_mse, 'r2': xgb_r2}
        
        # Train LightGBM
        logger.info("Training LightGBM...")
        lgb_model = lgb.LGBMRegressor(**self.hyperparameters['lightgbm'])
        lgb_model.fit(X_train_scaled, y_train)
        lgb_pred = lgb_model.predict(X_val_scaled)
        lgb_mse = mean_squared_error(y_val, lgb_pred)
        lgb_r2 = r2_score(y_val, lgb_pred)
        
        self.models['lightgbm'] = lgb_model
        training_results['lightgbm'] = {'mse': lgb_mse, 'r2': lgb_r2}
        
        # Train LSTM
        logger.info("Training LSTM...")
        lstm_X, lstm_y = self._prepare_lstm_data(combined_data[[target_col] + feature_cols[:10]])  # Use top 10 features
        
        if len(lstm_X) > 0:
            lstm_split = int(len(lstm_X) * 0.8)
            lstm_X_train, lstm_X_val = lstm_X[:lstm_split], lstm_X[lstm_split:]
            lstm_y_train, lstm_y_val = lstm_y[:lstm_split], lstm_y[lstm_split:]
            
            lstm_model = self._build_lstm_model((lstm_X_train.shape[1], lstm_X_train.shape[2]))
            
            # Early stopping callback
            early_stopping = keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            )
            
            lstm_model.fit(
                lstm_X_train, lstm_y_train,
                validation_data=(lstm_X_val, lstm_y_val),
                epochs=self.hyperparameters['lstm']['epochs'],
                batch_size=self.hyperparameters['lstm']['batch_size'],
                callbacks=[early_stopping],
                verbose=0
            )
            
            lstm_pred = lstm_model.predict(lstm_X_val)
            lstm_mse = mean_squared_error(lstm_y_val, lstm_pred)
            lstm_r2 = r2_score(lstm_y_val, lstm_pred)
            
            self.models['lstm'] = lstm_model
            training_results['lstm'] = {'mse': lstm_mse, 'r2': lstm_r2}
        
        # Calculate ensemble accuracy
        ensemble_pred = self._ensemble_predict(X_val)
        ensemble_mse = mean_squared_error(y_val, ensemble_pred)
        ensemble_r2 = r2_score(y_val, ensemble_pred)
        
        training_results['ensemble'] = {'mse': ensemble_mse, 'r2': ensemble_r2}
        
        # Update model metadata
        self.last_trained = datetime.utcnow()
        self.training_samples = len(X_train)
        self.last_accuracy = ensemble_r2
        
        # Save models
        self._save_models()
        
        logger.info(f"Model training completed. Ensemble R² score: {ensemble_r2:.4f}")
        
        return {
            'training_samples': self.training_samples,
            'validation_score': ensemble_r2,
            'training_time': 0,  # Would need to track actual time
            'version': self.version,
            'model_results': training_results
        }
    
    def _ensemble_predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make ensemble predictions using all trained models"""
        predictions = []
        weights = []
        
        # Random Forest prediction
        if 'random_forest' in self.models:
            rf_pred = self.models['random_forest'].predict(X)
            predictions.append(rf_pred)
            weights.append(self.ensemble_weights['random_forest'])
        
        # XGBoost prediction
        if 'xgboost' in self.models and 'tree_scaler' in self.scalers:
            X_scaled = self.scalers['tree_scaler'].transform(X)
            xgb_pred = self.models['xgboost'].predict(X_scaled)
            predictions.append(xgb_pred)
            weights.append(self.ensemble_weights['xgboost'])
        
        # LightGBM prediction
        if 'lightgbm' in self.models and 'tree_scaler' in self.scalers:
            X_scaled = self.scalers['tree_scaler'].transform(X)
            lgb_pred = self.models['lightgbm'].predict(X_scaled)
            predictions.append(lgb_pred)
            weights.append(self.ensemble_weights['lightgbm'])
        
        # Weighted average
        if predictions:
            weights = np.array(weights)
            weights = weights / np.sum(weights)  # Normalize weights
            ensemble_pred = np.average(predictions, axis=0, weights=weights)
            return ensemble_pred
        
        return np.array([])
    
    def predict(self, features: pd.DataFrame, horizon: int = 24) -> Dict[str, Any]:
        """Make price predictions for the specified horizon"""
        if not self.models:
            raise ValueError("Models not trained. Call train() first.")
        
        # Prepare features
        if set(self.feature_columns).issubset(set(features.columns)):
            X = features[self.feature_columns].tail(1)  # Use latest data point
        else:
            # Create features if not provided
            X = self._create_features(features)[self.feature_columns].tail(1)
        
        predictions = []
        current_features = X.copy()
        
        # Generate multi-step predictions
        for step in range(horizon):
            # Make ensemble prediction
            pred = self._ensemble_predict(current_features)
            
            if len(pred) > 0:
                predictions.append(pred[0])
                
                # Update features for next prediction (simplified approach)
                # In practice, you'd want to update all relevant features
                current_features = current_features.copy()
                # This would require more sophisticated feature updating logic
            else:
                predictions.append(features['close'].iloc[-1])  # Fallback to last known price
        
        # Calculate feature importance (from Random Forest)
        feature_importance = {}
        if 'random_forest' in self.models:
            importances = self.models['random_forest'].feature_importances_
            feature_importance = dict(zip(self.feature_columns, importances))
            # Sort by importance
            feature_importance = dict(sorted(feature_importance.items(), 
                                           key=lambda x: x[1], reverse=True))
        
        return {
            'predictions': predictions,
            'accuracy': self.last_accuracy or 0.0,
            'feature_importance': feature_importance
        }
    
    def calculate_confidence_intervals(self, features: pd.DataFrame, predictions: List[float], 
                                     confidence_level: float = 0.95) -> Dict[str, List[float]]:
        """Calculate confidence intervals for predictions"""
        # This is a simplified approach - in practice you'd want to use
        # more sophisticated methods like quantile regression or bootstrap
        
        # Calculate historical volatility
        if 'close' in features.columns:
            returns = features['close'].pct_change().dropna()
            volatility = returns.std()
        else:
            volatility = 0.01  # Default 1% volatility
        
        # Calculate confidence intervals based on volatility
        z_score = 1.96 if confidence_level == 0.95 else 2.58  # For 95% or 99%
        
        lower_bounds = []
        upper_bounds = []
        
        for i, pred in enumerate(predictions):
            # Increase uncertainty with prediction horizon
            horizon_factor = np.sqrt(i + 1)
            margin = z_score * volatility * pred * horizon_factor
            
            lower_bounds.append(pred - margin)
            upper_bounds.append(pred + margin)
        
        return {
            'lower': lower_bounds,
            'upper': upper_bounds
        }
    
    def retrain(self, training_data: Dict[str, pd.DataFrame], 
                force_retrain: bool = False) -> Dict[str, Any]:
        """Retrain models with new data"""
        # Check if retraining is needed
        if not force_retrain and self.last_trained:
            time_since_training = datetime.utcnow() - self.last_trained
            if time_since_training.total_seconds() < 86400:  # 24 hours
                logger.info("Models were recently trained. Skipping retraining.")
                return {
                    'training_samples': self.training_samples or 0,
                    'validation_score': self.last_accuracy or 0.0,
                    'training_time': 0,
                    'version': self.version
                }
        
        return self.train(training_data)
    
    def _save_models(self):
        """Save trained models to disk"""
        try:
            # Save sklearn models
            for name, model in self.models.items():
                if name in ['random_forest', 'xgboost', 'lightgbm']:
                    joblib.dump(model, os.path.join(self.model_dir, f'{name}_model.pkl'))
                elif name == 'lstm':
                    model.save(os.path.join(self.model_dir, f'{name}_model.h5'))
            
            # Save scalers
            for name, scaler in self.scalers.items():
                joblib.dump(scaler, os.path.join(self.model_dir, f'{name}.pkl'))
            
            # Save metadata
            metadata = {
                'feature_columns': self.feature_columns,
                'last_trained': self.last_trained.isoformat() if self.last_trained else None,
                'version': self.version,
                'last_accuracy': self.last_accuracy,
                'training_samples': self.training_samples,
                'ensemble_weights': self.ensemble_weights
            }
            
            joblib.dump(metadata, os.path.join(self.model_dir, 'metadata.pkl'))
            
            logger.info("Models saved successfully")
            
        except Exception as e:
            logger.error(f"Failed to save models: {e}")
    
    def _load_models(self):
        """Load existing models from disk"""
        try:
            # Load metadata
            metadata_path = os.path.join(self.model_dir, 'metadata.pkl')
            if os.path.exists(metadata_path):
                metadata = joblib.load(metadata_path)
                self.feature_columns = metadata.get('feature_columns', [])
                self.last_trained = datetime.fromisoformat(metadata['last_trained']) if metadata.get('last_trained') else None
                self.version = metadata.get('version', '1.0')
                self.last_accuracy = metadata.get('last_accuracy')
                self.training_samples = metadata.get('training_samples')
                self.ensemble_weights = metadata.get('ensemble_weights', self.ensemble_weights)
            
            # Load sklearn models
            for model_name in ['random_forest', 'xgboost', 'lightgbm']:
                model_path = os.path.join(self.model_dir, f'{model_name}_model.pkl')
                if os.path.exists(model_path):
                    self.models[model_name] = joblib.load(model_path)
                    logger.info(f"Loaded {model_name} model")
            
            # Load LSTM model
            lstm_path = os.path.join(self.model_dir, 'lstm_model.h5')
            if os.path.exists(lstm_path):
                self.models['lstm'] = keras.models.load_model(lstm_path)
                logger.info("Loaded LSTM model")
            
            # Load scalers
            for scaler_name in ['tree_scaler', 'lstm_scaler']:
                scaler_path = os.path.join(self.model_dir, f'{scaler_name}.pkl')
                if os.path.exists(scaler_path):
                    self.scalers[scaler_name] = joblib.load(scaler_path)
                    logger.info(f"Loaded {scaler_name}")
            
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            # Initialize empty models if loading fails
            self.models = {}
            self.scalers = {}