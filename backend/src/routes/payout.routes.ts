import express from 'express';
import {
  createPayout,
  handlePayoutWebhook,
  getPayouts,
  getPayout
} from '../controllers/payout.controller';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public webhook endpoint (no authentication)
router.post('/webhook', handlePayoutWebhook);

// Protect all routes with authentication
router.use(protect);

// Admin-only routes
router.use(authorize('admin'));

// Payout routes
router
  .route('/')
  .get(getPayouts)
  .post(createPayout);

router
  .route('/:id')
  .get(getPayout);

export default router;
