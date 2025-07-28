import { Router } from 'express';
import { AIAnalysisController } from '../controllers/AIAnalysisController';

const router = Router();

// AI Analysis endpoints
router.post('/analyze', AIAnalysisController.generateAnalysis);
router.get('/recommendations', AIAnalysisController.getRecommendations);
router.get('/history', AIAnalysisController.getAnalysisHistory);

// Risk Profile management
router.get('/risk-profile', AIAnalysisController.getRiskProfile);
router.put('/risk-profile', AIAnalysisController.updateRiskProfile);

// Feedback
router.post('/feedback', AIAnalysisController.submitFeedback);

export default router;