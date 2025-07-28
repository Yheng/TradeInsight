from flask import Flask, jsonify, request
from flask_cors import CORS
import MetaTrader5 as mt5
import logging
import os
from datetime import datetime
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class MT5Service:
    def __init__(self):
        self.initialized = False
        self.connection_config = {
            'login': int(os.getenv('MT5_LOGIN', 0)),
            'password': os.getenv('MT5_PASSWORD', ''),
            'server': os.getenv('MT5_SERVER', '')
        }
    
    def initialize(self):
        """Initialize MT5 connection"""
        try:
            if not mt5.initialize():
                logger.error(f"MT5 initialization failed: {mt5.last_error()}")
                return False
            
            # Login if credentials are provided
            if self.connection_config['login'] and self.connection_config['password']:
                login_result = mt5.login(
                    login=self.connection_config['login'],
                    password=self.connection_config['password'],
                    server=self.connection_config['server']
                )
                if not login_result:
                    logger.error(f"MT5 login failed: {mt5.last_error()}")
                    return False
                    
            self.initialized = True
            logger.info("MT5 service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"MT5 initialization error: {str(e)}")
            return False
    
    def get_symbol_info(self, symbol):
        """Get symbol information including current prices"""
        try:
            if not self.initialized:
                if not self.initialize():
                    raise Exception("MT5 not initialized")
            
            # Get symbol info
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                raise Exception(f"Symbol {symbol} not found")
            
            # Get current tick
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                raise Exception(f"Failed to get tick data for {symbol}")
            
            return {
                'symbol': symbol,
                'bid': float(tick.bid),
                'ask': float(tick.ask),
                'last': float(tick.last),
                'volume': int(tick.volume),
                'time': tick.time,
                'spread': float(tick.ask - tick.bid),
                'digits': symbol_info.digits,
                'point': symbol_info.point,
                'contract_size': symbol_info.trade_contract_size
            }
            
        except Exception as e:
            logger.error(f"Error getting symbol info for {symbol}: {str(e)}")
            raise
    
    def get_rates(self, symbol, timeframe='1H', count=100):
        """Get historical rates data"""
        try:
            if not self.initialized:
                if not self.initialize():
                    raise Exception("MT5 not initialized")
            
            # Map timeframe string to MT5 timeframe
            timeframe_map = {
                '1M': mt5.TIMEFRAME_M1,
                '5M': mt5.TIMEFRAME_M5,
                '15M': mt5.TIMEFRAME_M15,
                '30M': mt5.TIMEFRAME_M30,
                '1H': mt5.TIMEFRAME_H1,
                '4H': mt5.TIMEFRAME_H4,
                '1D': mt5.TIMEFRAME_D1
            }
            
            mt5_timeframe = timeframe_map.get(timeframe, mt5.TIMEFRAME_H1)
            
            # Get rates
            rates = mt5.copy_rates_from_pos(symbol, mt5_timeframe, 0, count)
            if rates is None:
                raise Exception(f"Failed to get rates for {symbol}")
            
            # Convert to list of dictionaries
            rates_list = []
            for rate in rates:
                rates_list.append({
                    'time': int(rate['time']),
                    'open': float(rate['open']),
                    'high': float(rate['high']),
                    'low': float(rate['low']),
                    'close': float(rate['close']),
                    'volume': int(rate['tick_volume'])
                })
            
            return rates_list
            
        except Exception as e:
            logger.error(f"Error getting rates for {symbol}: {str(e)}")
            raise
    
    def get_account_info(self):
        """Get account information"""
        try:
            if not self.initialized:
                if not self.initialize():
                    raise Exception("MT5 not initialized")
            
            account_info = mt5.account_info()
            if account_info is None:
                raise Exception("Failed to get account info")
            
            return {
                'login': account_info.login,
                'balance': float(account_info.balance),
                'equity': float(account_info.equity),
                'margin': float(account_info.margin),
                'free_margin': float(account_info.margin_free),
                'margin_level': float(account_info.margin_level) if account_info.margin_level else 0,
                'currency': account_info.currency,
                'server': account_info.server,
                'company': account_info.company
            }
            
        except Exception as e:
            logger.error(f"Error getting account info: {str(e)}")
            raise
    
    def get_positions(self):
        """Get open positions"""
        try:
            if not self.initialized:
                if not self.initialize():
                    raise Exception("MT5 not initialized")
            
            positions = mt5.positions_get()
            if positions is None:
                return []
            
            positions_list = []
            for pos in positions:
                positions_list.append({
                    'ticket': pos.ticket,
                    'symbol': pos.symbol,
                    'type': 'BUY' if pos.type == mt5.ORDER_TYPE_BUY else 'SELL',
                    'volume': float(pos.volume),
                    'price_open': float(pos.price_open),
                    'price_current': float(pos.price_current),
                    'profit': float(pos.profit),
                    'swap': float(pos.swap),
                    'commission': float(pos.commission),
                    'time': pos.time,
                    'comment': pos.comment
                })
            
            return positions_list
            
        except Exception as e:
            logger.error(f"Error getting positions: {str(e)}")
            raise
    
    def get_trade_history(self, start_date=None, end_date=None, max_trades=1000):
        """Get historical trade data"""
        try:
            if not self.initialized:
                if not self.initialize():
                    raise Exception("MT5 not initialized")
            
            # Set default dates if not provided
            if end_date is None:
                end_date = datetime.now()
            if start_date is None:
                start_date = datetime(end_date.year - 1, end_date.month, end_date.day)
            
            # Get deals (completed trades)
            deals = mt5.history_deals_get(start_date, end_date)
            if deals is None:
                return []
            
            trades_list = []
            for deal in deals[:max_trades]:  # Limit to max_trades
                trades_list.append({
                    'ticket': deal.ticket,
                    'order': deal.order,
                    'time': deal.time,
                    'type': 'BUY' if deal.type == mt5.DEAL_TYPE_BUY else 'SELL',
                    'entry': 'IN' if deal.entry == mt5.DEAL_ENTRY_IN else 'OUT',
                    'volume': float(deal.volume),
                    'price': float(deal.price),
                    'commission': float(deal.commission),
                    'swap': float(deal.swap),
                    'profit': float(deal.profit),
                    'symbol': deal.symbol,
                    'comment': deal.comment,
                    'magic': deal.magic
                })
            
            return trades_list
            
        except Exception as e:
            logger.error(f"Error getting trade history: {str(e)}")
            raise
    
    def connect_with_credentials(self, login, password, server):
        """Connect to MT5 with specific credentials"""
        try:
            # Shutdown existing connection
            mt5.shutdown()
            
            # Initialize MT5
            if not mt5.initialize():
                logger.error(f"MT5 initialization failed: {mt5.last_error()}")
                return False
            
            # Login with provided credentials
            login_result = mt5.login(
                login=int(login),
                password=password,
                server=server
            )
            
            if not login_result:
                error_msg = f"MT5 login failed: {mt5.last_error()}"
                logger.error(error_msg)
                return False
            
            self.initialized = True
            self.connection_config.update({
                'login': int(login),
                'password': password,
                'server': server
            })
            
            logger.info(f"MT5 connected successfully with account {login}")
            return True
            
        except Exception as e:
            logger.error(f"MT5 connection error: {str(e)}")
            return False

# Initialize MT5 service
mt5_service = MT5Service()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'mt5-service',
        'mt5_initialized': mt5_service.initialized,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/symbol-info/<symbol>', methods=['GET'])
def get_symbol_info(symbol):
    """Get symbol information and current prices"""
    try:
        data = mt5_service.get_symbol_info(symbol.upper())
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rates/<symbol>', methods=['GET'])
def get_rates(symbol):
    """Get historical rates data"""
    try:
        timeframe = request.args.get('timeframe', '1H')
        count = int(request.args.get('count', 100))
        
        data = mt5_service.get_rates(symbol.upper(), timeframe, count)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/account', methods=['GET'])
def get_account_info():
    """Get account information"""
    try:
        data = mt5_service.get_account_info()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/positions', methods=['GET'])
def get_positions():
    """Get open positions"""
    try:
        data = mt5_service.get_positions()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/symbols', methods=['GET'])
def get_symbols():
    """Get available symbols"""
    try:
        if not mt5_service.initialized:
            if not mt5_service.initialize():
                raise Exception("MT5 not initialized")
        
        symbols = mt5.symbols_get()
        if symbols is None:
            return jsonify([])
        
        symbols_list = []
        for symbol in symbols[:50]:  # Limit to first 50 symbols
            symbols_list.append({
                'name': symbol.name,
                'description': symbol.description,
                'currency_base': symbol.currency_base,
                'currency_profit': symbol.currency_profit,
                'digits': symbol.digits,
                'point': symbol.point
            })
        
        return jsonify(symbols_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/trades/history', methods=['GET'])
def get_trade_history():
    """Get historical trade data"""
    try:
        # Parse query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        max_trades = int(request.args.get('max_trades', 1000))
        
        start_date = None
        end_date = None
        
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        
        data = mt5_service.get_trade_history(start_date, end_date, max_trades)
        return jsonify({
            'trades': data,
            'count': len(data),
            'start_date': start_date.isoformat() if start_date else None,
            'end_date': end_date.isoformat() if end_date else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/connect', methods=['POST'])
def connect_mt5():
    """Connect to MT5 with credentials"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        login = data.get('login')
        password = data.get('password')
        server = data.get('server')
        
        if not all([login, password, server]):
            return jsonify({'error': 'login, password, and server are required'}), 400
        
        success = mt5_service.connect_with_credentials(login, password, server)
        
        if success:
            # Get account info to verify connection
            account_info = mt5_service.get_account_info()
            return jsonify({
                'success': True,
                'message': 'Connected to MT5 successfully',
                'account_info': account_info
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to connect to MT5'
            }), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/disconnect', methods=['POST'])
def disconnect_mt5():
    """Disconnect from MT5"""
    try:
        mt5.shutdown()
        mt5_service.initialized = False
        return jsonify({
            'success': True,
            'message': 'Disconnected from MT5'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Try to initialize MT5 on startup
    mt5_service.initialize()
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting MT5 service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)