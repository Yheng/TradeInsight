import { Router } from 'express';
import { OnboardingController } from '../controllers/OnboardingController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Require authentication for all onboarding routes
router.use(authMiddleware);

// Onboarding tracking
router.post('/step', OnboardingController.logOnboardingStep);
router.post('/complete', OnboardingController.completeOnboarding);
router.get('/status', OnboardingController.getOnboardingStatus);

export default router;