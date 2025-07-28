import { Router } from 'express';
import { MT5Controller } from '../controllers/MT5Controller';

const router = Router();

// Health check for MT5 service
router.get('/health', MT5Controller.healthCheck);

// Connection management
router.post('/connect', MT5Controller.connectMT5);
router.post('/disconnect', MT5Controller.disconnectMT5);

// Data fetching
router.get('/trades/history', MT5Controller.fetchTradeHistory);
router.get('/account', MT5Controller.getAccountInfo);
router.get('/positions', MT5Controller.getPositions);
router.get('/symbols', MT5Controller.getAvailableSymbols);
router.get('/symbol-info/:symbol', MT5Controller.getSymbolInfo);
router.get('/rates/:symbol', MT5Controller.getRates);

export default router;