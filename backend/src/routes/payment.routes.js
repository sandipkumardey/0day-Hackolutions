const express = require('express');
const {
    createOrder,
    verifyPayment,
    handleWebhook,
    getTransaction,
    getTransactions,
    requestRefund,
    getRefundStatus
} = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public webhook endpoint (no authentication)
router.post('/webhook', handleWebhook);

// Protected routes (require authentication)
router.use(protect);

// Create a new payment order
router.post('/create-order', createOrder);

// Verify payment (for client-side verification)
router.post('/verify', verifyPayment);

// Get transaction details
router.get('/transactions/:id', getTransaction);

// Get user's transaction history
router.get('/transactions', getTransactions);

// Request refund (admin only)
router.post('/:id/refund', authorize('admin'), requestRefund);

// Get refund status
router.get('/:id/refund-status', getRefundStatus);

module.exports = router;
