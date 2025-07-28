import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { mt5Service } from '../services/MT5Service';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export class MT5Controller {
  static async connectMT5(req: AuthenticatedRequest, res: Response) {
    try {
      const { login, password, server } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      if (!login || !password || !server) {
        return res.status(400).json({ 
          success: false, 
          error: 'login, password, and server are required' 
        });
      }

      // Connect to MT5
      const connectionResult = await mt5Service.connectToMT5({ login, password, server });

      if (!connectionResult.success) {
        // Log fetch error
        await DatabaseService.run(
          'INSERT INTO fetch_errors (id, user_id, error, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [uuidv4(), userId, connectionResult.error || 'Unknown connection error']
        );

        return res.status(400).json({
          success: false,
          error: connectionResult.error || 'Failed to connect to MT5'
        });
      }

      // Encrypt and store credentials
      const passwordHash = await bcrypt.hash(password, 12);
      const credentialId = uuidv4();

      // Deactivate old credentials
      await DatabaseService.run(
        'UPDATE user_mt5_credentials SET is_active = 0 WHERE user_id = ?',
        [userId]
      );

      // Store new credentials
      await DatabaseService.run(
        `INSERT INTO user_mt5_credentials 
         (id, user_id, account_id, password_encrypted, server, is_active) 
         VALUES (?, ?, ?, ?, ?, 1)`,
        [credentialId, userId, login, passwordHash, server]
      );

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'MT5_CONNECT', `Connected to MT5 account ${login} on ${server}`]
      );

      res.json({
        success: true,
        message: 'Connected to MT5 successfully',
        account_info: connectionResult.account_info
      });

    } catch (error: any) {
      logger.error('Error in connectMT5:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async disconnectMT5(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const result = await mt5Service.disconnectFromMT5();

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'MT5_DISCONNECT', 'Disconnected from MT5']
      );

      res.json(result);

    } catch (error: any) {
      logger.error('Error in disconnectMT5:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async fetchTradeHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { start_date, end_date, max_trades = 1000 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const result = await mt5Service.getTradeHistory(
        start_date as string,
        end_date as string,
        parseInt(max_trades as string) || 1000
      );

      if (result.error) {
        // Log fetch error
        await DatabaseService.run(
          'INSERT INTO fetch_errors (id, user_id, error, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [uuidv4(), userId, result.error]
        );

        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      // Store trades in database
      for (const trade of result.trades) {
        try {
          // Check if trade already exists
          const existingTrade = await DatabaseService.get(
            'SELECT id FROM trades WHERE user_id = ? AND mt5_ticket = ?',
            [userId, trade.ticket]
          );

          if (!existingTrade) {
            await DatabaseService.run(
              `INSERT INTO trades 
               (id, user_id, mt5_ticket, mt5_order, symbol, type, entry, volume, price, 
                profit, commission, swap, comment, magic, mt5_time) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                uuidv4(),
                userId,
                trade.ticket,
                trade.order,
                trade.symbol,
                trade.type,
                trade.entry,
                trade.volume,
                trade.price,
                trade.profit,
                trade.commission,
                trade.swap,
                trade.comment,
                trade.magic,
                trade.time
              ]
            );
          }
        } catch (dbError) {
          logger.error('Error storing trade:', dbError);
          // Continue with other trades
        }
      }

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'TRADE_FETCH', `Fetched ${result.count} trades`]
      );

      res.json({
        success: true,
        trades: result.trades,
        count: result.count
      });

    } catch (error: any) {
      logger.error('Error in fetchTradeHistory:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getAccountInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await mt5Service.getAccountInfo();

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        account_info: result.account_info
      });

    } catch (error: any) {
      logger.error('Error in getAccountInfo:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getPositions(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await mt5Service.getPositions();

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        positions: result.positions
      });

    } catch (error: any) {
      logger.error('Error in getPositions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getSymbolInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Symbol parameter is required'
        });
      }

      const result = await mt5Service.getSymbolInfo(symbol);

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        symbol_info: result.symbol_info
      });

    } catch (error: any) {
      logger.error('Error in getSymbolInfo:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getRates(req: AuthenticatedRequest, res: Response) {
    try {
      const { symbol } = req.params;
      const { timeframe = '1H', count = 100 } = req.query;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Symbol parameter is required'
        });
      }

      const result = await mt5Service.getRates(
        symbol,
        timeframe as string,
        parseInt(count as string) || 100
      );

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        rates: result.rates
      });

    } catch (error: any) {
      logger.error('Error in getRates:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getAvailableSymbols(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await mt5Service.getAvailableSymbols();

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        symbols: result.symbols
      });

    } catch (error: any) {
      logger.error('Error in getAvailableSymbols:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async healthCheck(req: AuthenticatedRequest, res: Response) {
    try {
      const isHealthy = await mt5Service.healthCheck();

      res.json({
        success: true,
        mt5_service_healthy: isHealthy,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Error in MT5 health check:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}