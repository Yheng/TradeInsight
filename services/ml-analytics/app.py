"""
Advanced ML Analytics Service for TradeInsight
Provides machine learning models for market prediction and pattern recognition
"""

import os
import logging
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import json

import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
import tensorflow as tf
from tensorflow import keras
import joblib
import yfinance as yf
import ta

# Import custom modules
from models.price_predictor import PricePredictionModel
from models.pattern_detector import PatternDetectionModel
from models.sentiment_analyzer import SentimentAnalysisModel
from models.risk_calculator import RiskCalculationModel
from utils.data_processor import DataProcessor
from utils.feature_engineer import FeatureEngineer
from utils.model_evaluator import ModelEvaluator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
class Config:
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    MODEL_CACHE_TTL = int(os.getenv('MODEL_CACHE_TTL', '3600'))  # 1 hour
    PREDICTION_CACHE_TTL = int(os.getenv('PREDICTION_CACHE_TTL', '300'))  # 5 minutes
    DATA_SOURCE = os.getenv('DATA_SOURCE', 'yfinance')  # yfinance, alpaca, mt5
    MODEL_RETRAINING_INTERVAL = int(os.getenv('MODEL_RETRAINING_INTERVAL', '86400'))  # 24 hours

# Initialize Redis client
try:
    redis_client = redis.from_url(Config.REDIS_URL)
    redis_client.ping()
    logger.info("Connected to Redis successfully")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}. Running without cache.")
    redis_client = None

# Initialize ML models
models = {
    'price_predictor': None,
    'pattern_detector': None,
    'sentiment_analyzer': None,
    'risk_calculator': None
}

# Initialize utilities
data_processor = DataProcessor()
feature_engineer = FeatureEngineer()
model_evaluator = ModelEvaluator()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check model status
        model_status = {}
        for name, model in models.items():
            model_status[name] = 'loaded' if model else 'not_loaded'
        
        # Check Redis connection
        redis_status = 'connected' if redis_client and redis_client.ping() else 'disconnected'
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'models': model_status,
            'redis': redis_status,
            'tensorflow_version': tf.__version__
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/predict/price', methods=['POST'])
def predict_price():
    """
    Predict future price movements using ML models
    
    Expected payload:
    {
        "symbol": "EURUSD",
        "timeframe": "1h",
        "horizon": 24,
        "features": ["price", "volume", "indicators"]
    }
    """
    try:
        data = request.get_json()
        symbol = data.get('symbol', 'EURUSD')
        timeframe = data.get('timeframe', '1h')
        horizon = data.get('horizon', 24)  # hours ahead
        features = data.get('features', ['price', 'volume', 'indicators'])
        
        # Validate inputs
        if horizon > 168:  # Max 1 week
            return jsonify({'error': 'Horizon cannot exceed 168 hours (1 week)'}), 400
        
        # Check cache first
        cache_key = f"price_prediction:{symbol}:{timeframe}:{horizon}"
        if redis_client:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info(f"Returning cached prediction for {symbol}")
                return jsonify(json.loads(cached_result))
        
        # Initialize price predictor if not loaded
        if not models['price_predictor']:
            models['price_predictor'] = PricePredictionModel()
        
        # Get historical data
        historical_data = data_processor.get_market_data(
            symbol=symbol,
            timeframe=timeframe,
            lookback_days=90
        )
        
        if historical_data.empty:
            return jsonify({'error': f'No data available for {symbol}'}), 404
        
        # Generate features
        features_df = feature_engineer.create_features(
            historical_data,
            feature_types=features
        )
        
        # Make prediction
        prediction_result = models['price_predictor'].predict(
            features_df,
            horizon=horizon
        )
        
        # Calculate confidence intervals
        confidence_intervals = models['price_predictor'].calculate_confidence_intervals(
            features_df,
            prediction_result['predictions']
        )
        
        # Prepare response
        result = {
            'symbol': symbol,
            'timeframe': timeframe,
            'horizon_hours': horizon,
            'current_price': float(historical_data['close'].iloc[-1]),
            'predictions': [
                {
                    'timestamp': (datetime.utcnow() + timedelta(hours=i+1)).isoformat(),
                    'predicted_price': float(pred),
                    'confidence_lower': float(confidence_intervals['lower'][i]),
                    'confidence_upper': float(confidence_intervals['upper'][i]),
                    'change_percent': float((pred - historical_data['close'].iloc[-1]) / historical_data['close'].iloc[-1] * 100)
                }
                for i, pred in enumerate(prediction_result['predictions'][:horizon])
            ],
            'model_accuracy': float(prediction_result.get('accuracy', 0)),
            'feature_importance': prediction_result.get('feature_importance', {}),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Cache result
        if redis_client:
            redis_client.setex(
                cache_key,
                Config.PREDICTION_CACHE_TTL,
                json.dumps(result, default=str)
            )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Price prediction error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/analyze/patterns', methods=['POST'])
def analyze_patterns():
    """
    Detect trading patterns in price data
    
    Expected payload:
    {
        "symbol": "EURUSD",
        "timeframe": "4h",
        "lookback_days": 30,
        "pattern_types": ["support_resistance", "trends", "candlestick", "technical"]
    }
    """
    try:
        data = request.get_json()
        symbol = data.get('symbol', 'EURUSD')
        timeframe = data.get('timeframe', '4h')
        lookback_days = data.get('lookback_days', 30)
        pattern_types = data.get('pattern_types', ['support_resistance', 'trends', 'candlestick'])
        
        # Initialize pattern detector if not loaded
        if not models['pattern_detector']:
            models['pattern_detector'] = PatternDetectionModel()
        
        # Get historical data
        historical_data = data_processor.get_market_data(
            symbol=symbol,
            timeframe=timeframe,
            lookback_days=lookback_days
        )
        
        if historical_data.empty:
            return jsonify({'error': f'No data available for {symbol}'}), 404
        
        # Detect patterns
        patterns = models['pattern_detector'].detect_patterns(
            historical_data,
            pattern_types=pattern_types
        )
        
        # Calculate pattern reliability scores
        reliability_scores = models['pattern_detector'].calculate_reliability(
            historical_data,
            patterns
        )
        
        # Prepare response
        result = {
            'symbol': symbol,
            'timeframe': timeframe,
            'analysis_period': f'{lookback_days} days',
            'patterns_detected': len(patterns),
            'patterns': [
                {
                    'type': pattern['type'],
                    'name': pattern['name'],
                    'start_time': pattern['start_time'].isoformat() if isinstance(pattern['start_time'], datetime) else pattern['start_time'],
                    'end_time': pattern['end_time'].isoformat() if isinstance(pattern['end_time'], datetime) else pattern['end_time'],
                    'confidence': float(pattern['confidence']),
                    'reliability_score': float(reliability_scores.get(pattern['id'], 0)),
                    'signal': pattern.get('signal', 'neutral'),  # bullish, bearish, neutral
                    'target_price': float(pattern.get('target_price', 0)) if pattern.get('target_price') else None,
                    'stop_loss': float(pattern.get('stop_loss', 0)) if pattern.get('stop_loss') else None,
                    'description': pattern.get('description', ''),
                    'parameters': pattern.get('parameters', {})
                }
                for pattern in patterns
            ],
            'summary': {
                'bullish_patterns': len([p for p in patterns if p.get('signal') == 'bullish']),
                'bearish_patterns': len([p for p in patterns if p.get('signal') == 'bearish']),
                'neutral_patterns': len([p for p in patterns if p.get('signal') == 'neutral']),
                'avg_confidence': float(np.mean([p['confidence'] for p in patterns])) if patterns else 0,
                'strongest_signal': max(patterns, key=lambda x: x['confidence'])['signal'] if patterns else 'neutral'
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Pattern analysis error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/analyze/sentiment', methods=['POST'])
def analyze_sentiment():
    """
    Analyze market sentiment from news and social media
    
    Expected payload:
    {
        "symbol": "EURUSD",
        "sources": ["news", "twitter", "reddit"],
        "lookback_days": 7
    }
    """
    try:
        data = request.get_json()
        symbol = data.get('symbol', 'EURUSD')
        sources = data.get('sources', ['news'])
        lookback_days = data.get('lookback_days', 7)
        
        # Initialize sentiment analyzer if not loaded
        if not models['sentiment_analyzer']:
            models['sentiment_analyzer'] = SentimentAnalysisModel()
        
        # Analyze sentiment
        sentiment_result = models['sentiment_analyzer'].analyze_sentiment(
            symbol=symbol,
            sources=sources,
            lookback_days=lookback_days
        )
        
        # Prepare response
        result = {
            'symbol': symbol,
            'analysis_period': f'{lookback_days} days',
            'sources_analyzed': sources,
            'overall_sentiment': {
                'score': float(sentiment_result['overall_score']),  # -1 to 1
                'label': sentiment_result['overall_label'],  # bearish, neutral, bullish
                'confidence': float(sentiment_result['confidence'])
            },
            'source_breakdown': {
                source: {
                    'score': float(sentiment_result['sources'][source]['score']),
                    'label': sentiment_result['sources'][source]['label'],
                    'article_count': sentiment_result['sources'][source]['count'],
                    'keywords': sentiment_result['sources'][source]['keywords'][:10]  # Top 10 keywords
                }
                for source in sources if source in sentiment_result['sources']
            },
            'sentiment_trend': [
                {
                    'date': point['date'].isoformat() if isinstance(point['date'], datetime) else point['date'],
                    'score': float(point['score']),
                    'volume': int(point['volume'])
                }
                for point in sentiment_result['trend_data']
            ],
            'impact_prediction': {
                'short_term': sentiment_result['impact']['short_term'],  # 1-3 days
                'medium_term': sentiment_result['impact']['medium_term'],  # 1-2 weeks
                'confidence': float(sentiment_result['impact']['confidence'])
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/calculate/risk', methods=['POST'])
def calculate_risk():
    """
    Calculate advanced risk metrics and scenarios
    
    Expected payload:
    {
        "portfolio": [
            {"symbol": "EURUSD", "position": 100000, "entry_price": 1.0850},
            {"symbol": "GBPUSD", "position": -50000, "entry_price": 1.2650}
        ],
        "timeframe": "1d",
        "confidence_level": 0.95,
        "scenario_analysis": true
    }
    """
    try:
        data = request.get_json()
        portfolio = data.get('portfolio', [])
        timeframe = data.get('timeframe', '1d')
        confidence_level = data.get('confidence_level', 0.95)
        scenario_analysis = data.get('scenario_analysis', True)
        
        if not portfolio:
            return jsonify({'error': 'Portfolio data is required'}), 400
        
        # Initialize risk calculator if not loaded
        if not models['risk_calculator']:
            models['risk_calculator'] = RiskCalculationModel()
        
        # Calculate risk metrics
        risk_result = models['risk_calculator'].calculate_portfolio_risk(
            portfolio=portfolio,
            timeframe=timeframe,
            confidence_level=confidence_level
        )
        
        # Perform scenario analysis if requested
        scenarios = {}
        if scenario_analysis:
            scenarios = models['risk_calculator'].run_scenario_analysis(
                portfolio=portfolio,
                scenarios=['market_crash', 'high_volatility', 'trend_reversal', 'correlation_breakdown']
            )
        
        # Prepare response
        result = {
            'portfolio_summary': {
                'total_positions': len(portfolio),
                'net_exposure': float(risk_result['net_exposure']),
                'gross_exposure': float(risk_result['gross_exposure']),
                'leverage': float(risk_result['leverage'])
            },
            'risk_metrics': {
                'value_at_risk': {
                    f'var_{int(confidence_level*100)}': float(risk_result['var']),
                    'currency': 'USD',
                    'timeframe': timeframe
                },
                'expected_shortfall': float(risk_result['expected_shortfall']),
                'maximum_drawdown': float(risk_result['max_drawdown']),
                'sharpe_ratio': float(risk_result['sharpe_ratio']),
                'sortino_ratio': float(risk_result['sortino_ratio']),
                'calmar_ratio': float(risk_result['calmar_ratio']),
                'volatility_annual': float(risk_result['volatility_annual'])
            },
            'position_analysis': [
                {
                    'symbol': pos['symbol'],
                    'position_size': pos['position'],
                    'market_value': float(pos['market_value']),
                    'unrealized_pnl': float(pos['unrealized_pnl']),
                    'position_var': float(pos['position_var']),
                    'contribution_to_risk': float(pos['risk_contribution']),
                    'correlation_risk': float(pos['correlation_risk'])
                }
                for pos in risk_result['positions']
            ],
            'scenario_analysis': {
                scenario_name: {
                    'probability': float(scenario_data['probability']),
                    'expected_loss': float(scenario_data['expected_loss']),
                    'worst_case_loss': float(scenario_data['worst_case_loss']),
                    'time_to_recovery_days': int(scenario_data['recovery_time']),
                    'affected_positions': scenario_data['affected_positions']
                }
                for scenario_name, scenario_data in scenarios.items()
            } if scenario_analysis else {},
            'recommendations': risk_result.get('recommendations', []),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Risk calculation error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/models/retrain', methods=['POST'])
def retrain_models():
    """
    Retrain ML models with latest data
    
    Expected payload:
    {
        "models": ["price_predictor", "pattern_detector"],
        "symbols": ["EURUSD", "GBPUSD", "USDJPY"],
        "force_retrain": false
    }
    """
    try:
        data = request.get_json()
        model_names = data.get('models', list(models.keys()))
        symbols = data.get('symbols', ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'])
        force_retrain = data.get('force_retrain', False)
        
        retrain_results = {}
        
        for model_name in model_names:
            if model_name not in models:
                continue
                
            try:
                logger.info(f"Retraining {model_name}...")
                
                # Get training data
                training_data = {}
                for symbol in symbols:
                    symbol_data = data_processor.get_market_data(
                        symbol=symbol,
                        timeframe='1h',
                        lookback_days=365  # 1 year of data
                    )
                    if not symbol_data.empty:
                        training_data[symbol] = symbol_data
                
                if not training_data:
                    retrain_results[model_name] = {
                        'status': 'failed',
                        'error': 'No training data available'
                    }
                    continue
                
                # Retrain model
                if model_name == 'price_predictor':
                    if not models[model_name]:
                        models[model_name] = PricePredictionModel()
                    
                    training_result = models[model_name].retrain(
                        training_data,
                        force_retrain=force_retrain
                    )
                    
                elif model_name == 'pattern_detector':
                    if not models[model_name]:
                        models[model_name] = PatternDetectionModel()
                    
                    training_result = models[model_name].retrain(
                        training_data,
                        force_retrain=force_retrain
                    )
                    
                elif model_name == 'sentiment_analyzer':
                    if not models[model_name]:
                        models[model_name] = SentimentAnalysisModel()
                    
                    training_result = models[model_name].retrain(
                        force_retrain=force_retrain
                    )
                    
                elif model_name == 'risk_calculator':
                    if not models[model_name]:
                        models[model_name] = RiskCalculationModel()
                    
                    training_result = models[model_name].retrain(
                        training_data,
                        force_retrain=force_retrain
                    )
                
                retrain_results[model_name] = {
                    'status': 'success',
                    'training_samples': training_result.get('training_samples', 0),
                    'validation_score': float(training_result.get('validation_score', 0)),
                    'training_time_seconds': float(training_result.get('training_time', 0)),
                    'model_version': training_result.get('version', '1.0')
                }
                
            except Exception as e:
                logger.error(f"Failed to retrain {model_name}: {e}")
                retrain_results[model_name] = {
                    'status': 'failed',
                    'error': str(e)
                }
        
        return jsonify({
            'retrain_results': retrain_results,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Model retraining error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/models/status', methods=['GET'])
def model_status():
    """Get status of all ML models"""
    try:
        status = {}
        
        for name, model in models.items():
            if model:
                status[name] = {
                    'loaded': True,
                    'last_trained': getattr(model, 'last_trained', None),
                    'version': getattr(model, 'version', '1.0'),
                    'accuracy': getattr(model, 'last_accuracy', None),
                    'training_samples': getattr(model, 'training_samples', None)
                }
            else:
                status[name] = {
                    'loaded': False,
                    'last_trained': None,
                    'version': None,
                    'accuracy': None,
                    'training_samples': None
                }
        
        return jsonify({
            'models': status,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Model status error: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

def initialize_models():
    """Initialize all ML models on startup"""
    try:
        logger.info("Initializing ML models...")
        
        # Initialize models with pre-trained weights if available
        models['price_predictor'] = PricePredictionModel()
        models['pattern_detector'] = PatternDetectionModel()
        models['sentiment_analyzer'] = SentimentAnalysisModel()
        models['risk_calculator'] = RiskCalculationModel()
        
        logger.info("All ML models initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize models: {e}")
        logger.error(traceback.format_exc())

if __name__ == '__main__':
    # Initialize models on startup
    initialize_models()
    
    # Start Flask app
    port = int(os.getenv('ML_ANALYTICS_PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting ML Analytics Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)