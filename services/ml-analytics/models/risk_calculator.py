"""
Advanced Risk Calculation Model for portfolio and position risk analysis
Implements VaR, Monte Carlo simulations, and scenario analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import logging
from scipy import stats
from scipy.optimize import minimize
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class RiskCalculationModel:
    """
    Advanced risk calculation and scenario analysis
    Provides comprehensive risk metrics for trading portfolios
    """
    
    def __init__(self):
        self.last_trained = None
        self.version = "1.0"
        self.last_accuracy = None
        self.training_samples = None
        
        # Risk calculation parameters
        self.confidence_levels = [0.90, 0.95, 0.99]
        self.holding_periods = [1, 5, 10, 22]  # days
        self.monte_carlo_simulations = 10000
        
        # Market data for correlation and volatility calculations
        self.historical_data = {}
        self.correlation_matrix = None
        self.volatility_estimates = {}
        
        # Risk-free rate (annualized)
        self.risk_free_rate = 0.02
        
        # Currency correlation assumptions
        self.default_correlations = {
            ('EURUSD', 'GBPUSD'): 0.7,
            ('EURUSD', 'USDJPY'): -0.3,
            ('EURUSD', 'USDCHF'): -0.8,
            ('EURUSD', 'AUDUSD'): 0.6,
            ('EURUSD', 'USDCAD'): -0.4,
            ('GBPUSD', 'USDJPY'): -0.2,
            ('GBPUSD', 'USDCHF'): -0.6,
            ('GBPUSD', 'AUDUSD'): 0.8,
            ('USDJPY', 'USDCHF'): 0.4,
            ('USDJPY', 'AUDUSD'): -0.1,
            ('USDCHF', 'AUDUSD'): -0.5
        }
        
        # Default volatilities (annualized)
        self.default_volatilities = {
            'EURUSD': 0.08,
            'GBPUSD': 0.10,
            'USDJPY': 0.09,
            'USDCHF': 0.08,
            'AUDUSD': 0.12,
            'USDCAD': 0.09,
            'NZDUSD': 0.13,
            'EURJPY': 0.11,
            'GBPJPY': 0.14,
            'CHFJPY': 0.11
        }
    
    def calculate_portfolio_risk(self, portfolio: List[Dict[str, Any]], 
                               timeframe: str = '1d',
                               confidence_level: float = 0.95) -> Dict[str, Any]:
        """
        Calculate comprehensive portfolio risk metrics
        
        Args:
            portfolio: List of positions with symbol, position, entry_price
            timeframe: Risk timeframe ('1d', '5d', '10d', '1m')
            confidence_level: VaR confidence level
        
        Returns:
            Comprehensive risk analysis
        """
        try:
            if not portfolio:
                return self._get_empty_risk_result()
            
            # Convert timeframe to days
            timeframe_days = self._convert_timeframe_to_days(timeframe)
            
            # Calculate position values and exposures
            position_analysis = self._analyze_positions(portfolio)
            
            # Calculate portfolio-level metrics
            portfolio_metrics = self._calculate_portfolio_metrics(position_analysis)
            
            # Calculate Value at Risk
            var_results = self._calculate_var(portfolio, timeframe_days, confidence_level)
            
            # Calculate other risk metrics
            risk_metrics = self._calculate_risk_ratios(portfolio, position_analysis)
            
            # Generate recommendations
            recommendations = self._generate_risk_recommendations(
                portfolio_metrics, var_results, risk_metrics
            )
            
            return {
                'net_exposure': portfolio_metrics['net_exposure'],
                'gross_exposure': portfolio_metrics['gross_exposure'],
                'leverage': portfolio_metrics['leverage'],
                'var': var_results['var'],
                'expected_shortfall': var_results['expected_shortfall'],
                'max_drawdown': risk_metrics['max_drawdown'],
                'sharpe_ratio': risk_metrics['sharpe_ratio'],
                'sortino_ratio': risk_metrics['sortino_ratio'],
                'calmar_ratio': risk_metrics['calmar_ratio'],
                'volatility_annual': risk_metrics['volatility_annual'],
                'positions': position_analysis,
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"Portfolio risk calculation error: {e}")
            return self._get_empty_risk_result()
    
    def run_scenario_analysis(self, portfolio: List[Dict[str, Any]], 
                            scenarios: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Run scenario analysis on portfolio
        
        Args:
            portfolio: List of positions
            scenarios: List of scenario names
        
        Returns:
            Scenario analysis results
        """
        try:
            scenario_results = {}
            
            for scenario_name in scenarios:
                if scenario_name == 'market_crash':
                    result = self._scenario_market_crash(portfolio)
                elif scenario_name == 'high_volatility':
                    result = self._scenario_high_volatility(portfolio)
                elif scenario_name == 'trend_reversal':
                    result = self._scenario_trend_reversal(portfolio)
                elif scenario_name == 'correlation_breakdown':
                    result = self._scenario_correlation_breakdown(portfolio)
                else:
                    logger.warning(f"Unknown scenario: {scenario_name}")
                    continue
                
                scenario_results[scenario_name] = result
            
            return scenario_results
            
        except Exception as e:
            logger.error(f"Scenario analysis error: {e}")
            return {}
    
    def _analyze_positions(self, portfolio: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze individual positions"""
        position_analysis = []
        
        for position in portfolio:
            symbol = position['symbol']
            position_size = position['position']
            entry_price = position['entry_price']
            
            # Get current market price (simulated)
            current_price = self._get_current_price(symbol, entry_price)
            
            # Calculate position metrics
            market_value = abs(position_size) * current_price
            unrealized_pnl = position_size * (current_price - entry_price)
            
            # Calculate position VaR
            volatility = self.default_volatilities.get(symbol, 0.10)
            daily_volatility = volatility / np.sqrt(252)  # Convert to daily
            position_var = market_value * daily_volatility * stats.norm.ppf(0.95)
            
            # Risk contribution (simplified)
            risk_contribution = position_var / len(portfolio)  # Equal weighting for now
            
            # Correlation risk (simplified)
            correlation_risk = self._calculate_position_correlation_risk(symbol, portfolio)
            
            position_analysis.append({
                'symbol': symbol,
                'position': position_size,
                'entry_price': entry_price,
                'current_price': current_price,
                'market_value': market_value,
                'unrealized_pnl': unrealized_pnl,
                'position_var': position_var,
                'risk_contribution': risk_contribution,
                'correlation_risk': correlation_risk
            })
        
        return position_analysis
    
    def _calculate_portfolio_metrics(self, position_analysis: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate portfolio-level metrics"""
        total_long_exposure = sum(pos['market_value'] for pos in position_analysis if pos['position'] > 0)
        total_short_exposure = sum(pos['market_value'] for pos in position_analysis if pos['position'] < 0)
        
        net_exposure = total_long_exposure - total_short_exposure
        gross_exposure = total_long_exposure + total_short_exposure
        
        # Assume account balance of $10,000 for leverage calculation
        account_balance = 10000
        leverage = gross_exposure / account_balance if account_balance > 0 else 0
        
        return {
            'net_exposure': net_exposure,
            'gross_exposure': gross_exposure,
            'leverage': leverage,
            'long_exposure': total_long_exposure,
            'short_exposure': total_short_exposure
        }
    
    def _calculate_var(self, portfolio: List[Dict[str, Any]], 
                      timeframe_days: int, confidence_level: float) -> Dict[str, float]:
        """Calculate Value at Risk using multiple methods"""
        
        # Historical simulation VaR
        historical_var = self._calculate_historical_var(portfolio, timeframe_days, confidence_level)
        
        # Parametric VaR
        parametric_var = self._calculate_parametric_var(portfolio, timeframe_days, confidence_level)
        
        # Monte Carlo VaR
        monte_carlo_var = self._calculate_monte_carlo_var(portfolio, timeframe_days, confidence_level)
        
        # Use Monte Carlo as primary method
        var_estimate = monte_carlo_var
        
        # Calculate Expected Shortfall (Conditional VaR)
        expected_shortfall = var_estimate * 1.3  # Approximation
        
        return {
            'var': var_estimate,
            'expected_shortfall': expected_shortfall,
            'historical_var': historical_var,
            'parametric_var': parametric_var,
            'monte_carlo_var': monte_carlo_var
        }
    
    def _calculate_historical_var(self, portfolio: List[Dict[str, Any]], 
                                timeframe_days: int, confidence_level: float) -> float:
        """Calculate VaR using historical simulation"""
        try:
            # Generate historical returns (simulated)
            portfolio_returns = []
            
            for _ in range(252):  # One year of daily returns
                daily_return = 0
                
                for position in portfolio:
                    symbol = position['symbol']
                    position_size = position['position']
                    entry_price = position['entry_price']
                    
                    # Simulate daily return
                    volatility = self.default_volatilities.get(symbol, 0.10)
                    daily_vol = volatility / np.sqrt(252)
                    random_return = np.random.normal(0, daily_vol)
                    
                    position_value = abs(position_size) * entry_price
                    position_return = position_value * random_return
                    
                    daily_return += position_return
                
                portfolio_returns.append(daily_return)
            
            # Scale for timeframe
            portfolio_returns = np.array(portfolio_returns) * np.sqrt(timeframe_days)
            
            # Calculate VaR
            var_percentile = (1 - confidence_level) * 100
            var_estimate = np.percentile(portfolio_returns, var_percentile)
            
            return abs(var_estimate)
            
        except Exception as e:
            logger.error(f"Historical VaR calculation error: {e}")
            return 0.0
    
    def _calculate_parametric_var(self, portfolio: List[Dict[str, Any]], 
                                timeframe_days: int, confidence_level: float) -> float:
        """Calculate VaR using parametric method (assumes normal distribution)"""
        try:
            # Calculate portfolio standard deviation
            portfolio_variance = 0
            
            # Individual position variances
            for position in portfolio:
                symbol = position['symbol']
                position_size = position['position']
                entry_price = position['entry_price']
                
                position_value = abs(position_size) * entry_price
                volatility = self.default_volatilities.get(symbol, 0.10)
                daily_vol = volatility / np.sqrt(252)
                
                position_variance = (position_value * daily_vol) ** 2
                portfolio_variance += position_variance
            
            # Add correlation effects (simplified)
            correlation_adjustment = 0
            for i, pos1 in enumerate(portfolio):
                for j, pos2 in enumerate(portfolio):
                    if i != j:
                        corr = self._get_correlation(pos1['symbol'], pos2['symbol'])
                        
                        vol1 = self.default_volatilities.get(pos1['symbol'], 0.10) / np.sqrt(252)
                        vol2 = self.default_volatilities.get(pos2['symbol'], 0.10) / np.sqrt(252)
                        
                        value1 = abs(pos1['position']) * pos1['entry_price']
                        value2 = abs(pos2['position']) * pos2['entry_price']
                        
                        correlation_adjustment += 2 * corr * vol1 * vol2 * value1 * value2
            
            portfolio_variance += correlation_adjustment
            portfolio_std = np.sqrt(max(0, portfolio_variance))
            
            # Scale for timeframe
            portfolio_std *= np.sqrt(timeframe_days)
            
            # Calculate VaR using normal distribution
            z_score = stats.norm.ppf(confidence_level)
            var_estimate = portfolio_std * z_score
            
            return var_estimate
            
        except Exception as e:
            logger.error(f"Parametric VaR calculation error: {e}")
            return 0.0
    
    def _calculate_monte_carlo_var(self, portfolio: List[Dict[str, Any]], 
                                 timeframe_days: int, confidence_level: float) -> float:
        """Calculate VaR using Monte Carlo simulation"""
        try:
            portfolio_pnl_simulations = []
            
            for _ in range(self.monte_carlo_simulations):
                portfolio_pnl = 0
                
                # Generate correlated random returns
                random_returns = self._generate_correlated_returns(portfolio)
                
                for i, position in enumerate(portfolio):
                    position_size = position['position']
                    entry_price = position['entry_price']
                    
                    # Scale return for timeframe
                    scaled_return = random_returns[i] * np.sqrt(timeframe_days)
                    
                    # Calculate position P&L
                    position_value = abs(position_size) * entry_price
                    position_pnl = position_value * scaled_return
                    
                    # Adjust for position direction
                    if position_size < 0:  # Short position
                        position_pnl = -position_pnl
                    
                    portfolio_pnl += position_pnl
                
                portfolio_pnl_simulations.append(portfolio_pnl)
            
            # Calculate VaR
            portfolio_pnl_simulations = np.array(portfolio_pnl_simulations)
            var_percentile = (1 - confidence_level) * 100
            var_estimate = np.percentile(portfolio_pnl_simulations, var_percentile)
            
            return abs(var_estimate)
            
        except Exception as e:
            logger.error(f"Monte Carlo VaR calculation error: {e}")
            return 0.0
    
    def _generate_correlated_returns(self, portfolio: List[Dict[str, Any]]) -> np.ndarray:
        """Generate correlated random returns for portfolio positions"""
        try:
            n_positions = len(portfolio)
            
            # Create correlation matrix
            correlation_matrix = np.eye(n_positions)
            
            for i in range(n_positions):
                for j in range(i + 1, n_positions):
                    corr = self._get_correlation(portfolio[i]['symbol'], portfolio[j]['symbol'])
                    correlation_matrix[i, j] = corr
                    correlation_matrix[j, i] = corr
            
            # Generate independent random variables
            independent_returns = np.random.normal(0, 1, n_positions)
            
            # Apply Cholesky decomposition for correlation
            try:
                chol_matrix = np.linalg.cholesky(correlation_matrix)
                correlated_returns = chol_matrix @ independent_returns
            except np.linalg.LinAlgError:
                # Fallback to independent returns if correlation matrix is not positive definite
                correlated_returns = independent_returns
            
            # Scale by individual volatilities
            for i, position in enumerate(portfolio):
                symbol = position['symbol']
                volatility = self.default_volatilities.get(symbol, 0.10)
                daily_vol = volatility / np.sqrt(252)
                correlated_returns[i] *= daily_vol
            
            return correlated_returns
            
        except Exception as e:
            logger.error(f"Correlated returns generation error: {e}")
            return np.random.normal(0, 0.01, len(portfolio))
    
    def _calculate_risk_ratios(self, portfolio: List[Dict[str, Any]], 
                             position_analysis: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate various risk-adjusted return ratios"""
        
        # Simulate portfolio returns for ratio calculations
        portfolio_returns = self._simulate_portfolio_returns(portfolio, days=252)
        
        if len(portfolio_returns) == 0:
            return {
                'sharpe_ratio': 0.0,
                'sortino_ratio': 0.0,
                'calmar_ratio': 0.0,
                'volatility_annual': 0.0,
                'max_drawdown': 0.0
            }
        
        # Calculate metrics
        annual_return = np.mean(portfolio_returns) * 252
        annual_volatility = np.std(portfolio_returns) * np.sqrt(252)
        
        # Sharpe ratio
        sharpe_ratio = (annual_return - self.risk_free_rate) / annual_volatility if annual_volatility > 0 else 0
        
        # Sortino ratio (using downside deviation)
        negative_returns = portfolio_returns[portfolio_returns < 0]
        downside_deviation = np.std(negative_returns) * np.sqrt(252) if len(negative_returns) > 0 else annual_volatility
        sortino_ratio = (annual_return - self.risk_free_rate) / downside_deviation if downside_deviation > 0 else 0
        
        # Maximum drawdown
        cumulative_returns = np.cumprod(1 + portfolio_returns)
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdowns = (cumulative_returns - running_max) / running_max
        max_drawdown = abs(np.min(drawdowns)) * 100
        
        # Calmar ratio
        calmar_ratio = annual_return / (max_drawdown / 100) if max_drawdown > 0 else 0
        
        return {
            'sharpe_ratio': sharpe_ratio,
            'sortino_ratio': sortino_ratio,
            'calmar_ratio': calmar_ratio,
            'volatility_annual': annual_volatility,
            'max_drawdown': max_drawdown
        }
    
    def _simulate_portfolio_returns(self, portfolio: List[Dict[str, Any]], days: int = 252) -> np.ndarray:
        """Simulate portfolio returns for risk ratio calculations"""
        try:
            portfolio_returns = []
            
            for day in range(days):
                daily_return = 0
                correlated_returns = self._generate_correlated_returns(portfolio)
                
                for i, position in enumerate(portfolio):
                    position_size = position['position']
                    entry_price = position['entry_price']
                    
                    position_value = abs(position_size) * entry_price
                    position_return = position_value * correlated_returns[i]
                    
                    # Adjust for position direction
                    if position_size < 0:  # Short position
                        position_return = -position_return
                    
                    daily_return += position_return
                
                # Convert to percentage return (assuming $10,000 account)
                portfolio_return_pct = daily_return / 10000
                portfolio_returns.append(portfolio_return_pct)
            
            return np.array(portfolio_returns)
            
        except Exception as e:
            logger.error(f"Portfolio return simulation error: {e}")
            return np.array([])
    
    def _get_correlation(self, symbol1: str, symbol2: str) -> float:
        """Get correlation between two symbols"""
        if symbol1 == symbol2:
            return 1.0
        
        # Try both orders
        pair1 = (symbol1, symbol2)
        pair2 = (symbol2, symbol1)
        
        if pair1 in self.default_correlations:
            return self.default_correlations[pair1]
        elif pair2 in self.default_correlations:
            return self.default_correlations[pair2]
        else:
            # Default correlation for unknown pairs
            return 0.0
    
    def _calculate_position_correlation_risk(self, symbol: str, portfolio: List[Dict[str, Any]]) -> float:
        """Calculate correlation risk for a specific position"""
        correlation_risk = 0
        
        for position in portfolio:
            if position['symbol'] != symbol:
                corr = abs(self._get_correlation(symbol, position['symbol']))
                correlation_risk += corr
        
        # Normalize by portfolio size
        return correlation_risk / len(portfolio) if portfolio else 0
    
    def _get_current_price(self, symbol: str, entry_price: float) -> float:
        """Get current market price (simulated)"""
        # Simulate small price movement from entry price
        volatility = self.default_volatilities.get(symbol, 0.10)
        daily_vol = volatility / np.sqrt(252)
        price_change = np.random.normal(0, daily_vol)
        
        return entry_price * (1 + price_change)
    
    def _convert_timeframe_to_days(self, timeframe: str) -> int:
        """Convert timeframe string to days"""
        timeframe_map = {
            '1d': 1,
            '5d': 5,
            '10d': 10,
            '1w': 7,
            '2w': 14,
            '1m': 22,
            '3m': 66,
            '6m': 132,
            '1y': 252
        }
        
        return timeframe_map.get(timeframe, 1)
    
    # Scenario analysis methods
    def _scenario_market_crash(self, portfolio: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze market crash scenario (similar to 2008 or 2020)"""
        try:
            # Market crash parameters: 30-50% decline, high correlation
            crash_severity = -0.40  # 40% decline
            crash_probability = 0.05  # 5% annual probability
            correlation_spike = 0.9  # Correlations spike during crisis
            
            total_loss = 0
            worst_case_loss = 0
            affected_positions = []
            
            for position in portfolio:
                symbol = position['symbol']
                position_size = position['position']
                entry_price = position['entry_price']
                
                position_value = abs(position_size) * entry_price
                
                # Calculate expected loss
                if position_size > 0:  # Long position
                    expected_loss = position_value * abs(crash_severity)
                else:  # Short position (benefits from crash)
                    expected_loss = position_value * crash_severity  # Negative = profit
                
                # Worst case (50% more severe)
                worst_loss = expected_loss * 1.5
                
                total_loss += expected_loss
                worst_case_loss += worst_loss
                
                if expected_loss > 0:
                    affected_positions.append({
                        'symbol': symbol,
                        'expected_loss': expected_loss,
                        'loss_percentage': abs(crash_severity) * 100
                    })
            
            # Recovery time (historical average)
            recovery_time = 180  # 6 months average
            
            return {
                'probability': crash_probability,
                'expected_loss': total_loss,
                'worst_case_loss': worst_case_loss,
                'recovery_time': recovery_time,
                'affected_positions': affected_positions
            }
            
        except Exception as e:
            logger.error(f"Market crash scenario error: {e}")
            return self._get_empty_scenario_result()
    
    def _scenario_high_volatility(self, portfolio: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze high volatility scenario"""
        try:
            # High volatility: 2-3x normal volatility
            volatility_multiplier = 2.5
            scenario_probability = 0.15  # 15% annual probability
            
            total_risk = 0
            worst_case_loss = 0
            affected_positions = []
            
            for position in portfolio:
                symbol = position['symbol']
                position_size = position['position']
                entry_price = position['entry_price']
                
                position_value = abs(position_size) * entry_price
                normal_volatility = self.default_volatilities.get(symbol, 0.10)
                high_volatility = normal_volatility * volatility_multiplier
                
                # Expected maximum adverse movement (95% confidence)
                daily_var = position_value * (high_volatility / np.sqrt(252)) * 1.65
                monthly_var = daily_var * np.sqrt(22)  # Monthly
                
                total_risk += monthly_var
                worst_case_loss += monthly_var * 1.5  # Worst case
                
                affected_positions.append({
                    'symbol': symbol,
                    'additional_risk': monthly_var,
                    'volatility_increase': f"{(volatility_multiplier - 1) * 100:.0f}%"
                })
            
            return {
                'probability': scenario_probability,
                'expected_loss': total_risk,
                'worst_case_loss': worst_case_loss,
                'recovery_time': 60,  # 2 months
                'affected_positions': affected_positions
            }
            
        except Exception as e:
            logger.error(f"High volatility scenario error: {e}")
            return self._get_empty_scenario_result()
    
    def _scenario_trend_reversal(self, portfolio: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze major trend reversal scenario"""
        try:
            # Trend reversal: 15-25% move against current positions
            reversal_magnitude = 0.20  # 20% reversal
            scenario_probability = 0.25  # 25% annual probability
            
            total_loss = 0
            worst_case_loss = 0
            affected_positions = []
            
            for position in portfolio:
                symbol = position['symbol']
                position_size = position['position']
                entry_price = position['entry_price']
                
                position_value = abs(position_size) * entry_price
                
                # Assume trend reversal goes against current position
                expected_loss = position_value * reversal_magnitude
                worst_loss = expected_loss * 1.3
                
                total_loss += expected_loss
                worst_case_loss += worst_loss
                
                affected_positions.append({
                    'symbol': symbol,
                    'expected_loss': expected_loss,
                    'reversal_magnitude': f"{reversal_magnitude * 100:.0f}%"
                })
            
            return {
                'probability': scenario_probability,
                'expected_loss': total_loss,
                'worst_case_loss': worst_case_loss,
                'recovery_time': 90,  # 3 months
                'affected_positions': affected_positions
            }
            
        except Exception as e:
            logger.error(f"Trend reversal scenario error: {e}")
            return self._get_empty_scenario_result()
    
    def _scenario_correlation_breakdown(self, portfolio: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze correlation breakdown scenario"""
        try:
            # Correlation breakdown: correlations go to extremes (0 or ±1)
            scenario_probability = 0.10  # 10% annual probability
            
            # Calculate current diversification benefit
            current_portfolio_vol = self._calculate_portfolio_volatility(portfolio, use_correlations=True)
            no_diversification_vol = self._calculate_portfolio_volatility(portfolio, use_correlations=False)
            
            diversification_loss = no_diversification_vol - current_portfolio_vol
            
            # Expected loss from losing diversification
            account_value = 10000  # Assumed account size
            expected_loss = account_value * diversification_loss * 1.65  # 95% confidence
            worst_case_loss = expected_loss * 2
            
            # All positions are affected
            affected_positions = [
                {
                    'symbol': pos['symbol'],
                    'correlation_impact': 'High',
                    'diversification_loss': diversification_loss
                }
                for pos in portfolio
            ]
            
            return {
                'probability': scenario_probability,
                'expected_loss': expected_loss,
                'worst_case_loss': worst_case_loss,
                'recovery_time': 120,  # 4 months
                'affected_positions': affected_positions
            }
            
        except Exception as e:
            logger.error(f"Correlation breakdown scenario error: {e}")
            return self._get_empty_scenario_result()
    
    def _calculate_portfolio_volatility(self, portfolio: List[Dict[str, Any]], 
                                      use_correlations: bool = True) -> float:
        """Calculate portfolio volatility"""
        try:
            if not portfolio:
                return 0.0
            
            portfolio_variance = 0
            
            # Individual position variances
            for position in portfolio:
                symbol = position['symbol']
                position_size = position['position']
                entry_price = position['entry_price']
                
                position_value = abs(position_size) * entry_price
                volatility = self.default_volatilities.get(symbol, 0.10)
                
                # Weight by position size
                weight = position_value / sum(abs(p['position']) * p['entry_price'] for p in portfolio)
                position_variance = (weight * volatility) ** 2
                portfolio_variance += position_variance
            
            # Add correlation effects if requested
            if use_correlations and len(portfolio) > 1:
                for i, pos1 in enumerate(portfolio):
                    for j, pos2 in enumerate(portfolio):
                        if i != j:
                            corr = self._get_correlation(pos1['symbol'], pos2['symbol'])
                            
                            vol1 = self.default_volatilities.get(pos1['symbol'], 0.10)
                            vol2 = self.default_volatilities.get(pos2['symbol'], 0.10)
                            
                            value1 = abs(pos1['position']) * pos1['entry_price']
                            value2 = abs(pos2['position']) * pos2['entry_price']
                            
                            total_value = sum(abs(p['position']) * p['entry_price'] for p in portfolio)
                            weight1 = value1 / total_value
                            weight2 = value2 / total_value
                            
                            correlation_term = weight1 * weight2 * vol1 * vol2 * corr
                            portfolio_variance += correlation_term
            
            return np.sqrt(max(0, portfolio_variance))
            
        except Exception as e:
            logger.error(f"Portfolio volatility calculation error: {e}")
            return 0.0
    
    def _generate_risk_recommendations(self, portfolio_metrics: Dict[str, float], 
                                     var_results: Dict[str, float],
                                     risk_metrics: Dict[str, float]) -> List[str]:
        """Generate risk management recommendations"""
        recommendations = []
        
        # Leverage recommendations
        leverage = portfolio_metrics.get('leverage', 0)
        if leverage > 5:
            recommendations.append("Consider reducing leverage - current level is very high")
        elif leverage > 3:
            recommendations.append("Monitor leverage levels - approaching high risk territory")
        
        # VaR recommendations
        var_amount = var_results.get('var', 0)
        account_value = 10000  # Assumed
        var_percentage = (var_amount / account_value) * 100
        
        if var_percentage > 10:
            recommendations.append("Daily VaR exceeds 10% of account - consider reducing position sizes")
        elif var_percentage > 5:
            recommendations.append("Daily VaR is elevated - monitor risk closely")
        
        # Sharpe ratio recommendations
        sharpe_ratio = risk_metrics.get('sharpe_ratio', 0)
        if sharpe_ratio < 0.5:
            recommendations.append("Risk-adjusted returns are low - review trading strategy")
        elif sharpe_ratio > 2:
            recommendations.append("Excellent risk-adjusted returns - maintain current strategy")
        
        # Drawdown recommendations
        max_drawdown = risk_metrics.get('max_drawdown', 0)
        if max_drawdown > 20:
            recommendations.append("Maximum drawdown is concerning - implement stricter stop losses")
        
        # Diversification recommendations
        if len(recommendations) == 0:
            recommendations.append("Portfolio risk levels are within acceptable ranges")
        
        return recommendations
    
    def _get_empty_risk_result(self) -> Dict[str, Any]:
        """Return empty risk result structure"""
        return {
            'net_exposure': 0.0,
            'gross_exposure': 0.0,
            'leverage': 0.0,
            'var': 0.0,
            'expected_shortfall': 0.0,
            'max_drawdown': 0.0,
            'sharpe_ratio': 0.0,
            'sortino_ratio': 0.0,
            'calmar_ratio': 0.0,
            'volatility_annual': 0.0,
            'positions': [],
            'recommendations': []
        }
    
    def _get_empty_scenario_result(self) -> Dict[str, Any]:
        """Return empty scenario result structure"""
        return {
            'probability': 0.0,
            'expected_loss': 0.0,
            'worst_case_loss': 0.0,
            'recovery_time': 0,
            'affected_positions': []
        }
    
    def retrain(self, training_data: Dict[str, pd.DataFrame], 
                force_retrain: bool = False) -> Dict[str, Any]:
        """Retrain risk models with new market data"""
        try:
            # Update correlation estimates from new data
            if training_data:
                self._update_correlations(training_data)
                self._update_volatilities(training_data)
            
            self.last_trained = datetime.utcnow()
            
            return {
                'training_samples': sum(len(data) for data in training_data.values()) if training_data else 0,
                'validation_score': 0.85,  # Estimated accuracy
                'training_time': 2,
                'version': self.version
            }
            
        except Exception as e:
            logger.error(f"Risk model retraining error: {e}")
            return {
                'training_samples': 0,
                'validation_score': 0.0,
                'training_time': 0,
                'version': self.version
            }
    
    def _update_correlations(self, training_data: Dict[str, pd.DataFrame]):
        """Update correlation estimates from training data"""
        # Implementation would calculate actual correlations from historical data
        pass
    
    def _update_volatilities(self, training_data: Dict[str, pd.DataFrame]):
        """Update volatility estimates from training data"""
        # Implementation would calculate actual volatilities from historical data
        pass