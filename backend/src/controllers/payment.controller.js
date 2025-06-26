const Razorpay = require('razorpay');
const crypto = require('crypto');
const Hackathon = require('../models/Hackathon');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Initialize Razorpay with environment variables
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    : null;

if (!razorpay) {
    console.warn('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not set. Payment API will not be functional.');
}

// @desc    Create a Razorpay order for hackathon registration
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
    if (!razorpay) {
        return next(new ErrorResponse('Payment service is currently unavailable', 503));
    }

    const { hackathonId, userId } = req.body;

    // Input validation
    if (!hackathonId || !userId) {
        return next(new ErrorResponse('Hackathon ID and User ID are required', 400));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    // Check if hackathon exists and is paid
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
        return next(new ErrorResponse('Hackathon not found', 404));
    }

    if (hackathon.price <= 0) {
        return next(new ErrorResponse('This is a free hackathon', 400));
    }

    // Check if user has already registered for this hackathon
    const existingTransaction = await Transaction.findOne({
        user_id: userId,
        hackathon_id: hackathonId,
        status: 'success'
    });

    if (existingTransaction) {
        return next(new ErrorResponse('You have already registered for this hackathon', 400));
    }

    try {
        const receipt = `hack_${hackathonId.slice(-6)}_user_${userId.slice(-6)}_${Date.now()}`;
        
        const options = {
            amount: Math.round(hackathon.price * 100), // Convert to paise
            currency: (hackathon.currency || 'INR').toUpperCase(),
            receipt: receipt,
            notes: {
                hackathonId: hackathonId,
                userId: userId,
                type: 'hackathon_registration'
            },
            payment_capture: 1 // Auto-capture payment
        };

        const order = await razorpay.orders.create(options);

        // Create a pending transaction record
        const transaction = await Transaction.create({
            user_id: userId,
            hackathon_id: hackathonId,
            amount: hackathon.price,
            currency: hackathon.currency || 'INR',
            status: 'pending',
            type: 'hackathon_registration',
            razorpay_order_id: order.id,
            metadata: {
                hackathon_name: hackathon.name,
                user_email: user.email,
                receipt: receipt
            }
        });

        res.status(201).json({
            success: true,
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                created_at: order.created_at,
                transaction_id: transaction._id
            }
        });

    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        return next(new ErrorResponse('Failed to create payment order', 500));
    }
});

// @desc    Verify Razorpay payment (for direct API calls)
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res, next) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return next(new ErrorResponse('Missing required payment verification data', 400));
    }

    try {
        // Find the transaction
        const transaction = await Transaction.findOne({ razorpay_order_id });
        if (!transaction) {
            return next(new ErrorResponse('Transaction not found', 404));
        }

        // Verify payment status with Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        
        if (payment.status !== 'captured' && payment.status !== 'authorized') {
            return next(new ErrorResponse('Payment not successful', 400));
        }

        // Verify signature
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return next(new ErrorResponse('Invalid payment signature', 400));
        }

        // Update transaction
        transaction.status = 'success';
        transaction.razorpay_payment_id = razorpay_payment_id;
        transaction.razorpay_signature = razorpay_signature;
        transaction.payment_details = {
            method: payment.method,
            bank: payment.bank,
            wallet: payment.wallet,
            vpa: payment.vpa,
            card_id: payment.card_id,
            bank_transaction_id: payment.bank_transaction_id
        };
        transaction.completed_at = new Date();
        await transaction.save();

        // Here you can add additional logic like sending confirmation emails,
        // creating registration records, etc.

        console.log(`Payment verified successfully for order: ${razorpay_order_id}`);

        res.status(200).json({
            success: true,
            data: {
                transaction_id: transaction._id,
                status: 'success',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
            }
        });

    } catch (error) {
        console.error('Payment verification failed:', error);
        return next(new ErrorResponse('Payment verification failed', 500));
    }
});

// @desc    Handle Razorpay webhook events
// @route   POST /api/payments/webhook
// @access  Public (called by Razorpay)
exports.handleWebhook = asyncHandler(async (req, res, next) => {
    const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
        console.error('RAZORPAY_WEBHOOK_SECRET is not set');
        return res.status(500).json({ status: 'error', message: 'Server configuration error' });
    }

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payment = req.body.payload.payment?.entity;
    const orderId = payment?.order_id;

    if (!orderId) {
        console.error('No order ID in webhook payload');
        return res.status(400).json({ status: 'error', message: 'No order ID' });
    }

    try {
        // Find the transaction
        const transaction = await Transaction.findOne({ razorpay_order_id: orderId });
        if (!transaction) {
            console.error(`Transaction not found for order: ${orderId}`);
            return res.status(404).json({ status: 'error', message: 'Transaction not found' });
        }

        // Handle different webhook events
        switch (event) {
            case 'payment.authorized':
                // Payment is authorized but not yet captured
                transaction.status = 'authorized';
                transaction.razorpay_payment_id = payment.id;
                transaction.payment_details = {
                    method: payment.method,
                    bank: payment.bank,
                    wallet: payment.wallet,
                    vpa: payment.vpa,
                    card_id: payment.card_id
                };
                break;

            case 'payment.captured':
                // Payment is captured (successful)
                transaction.status = 'success';
                transaction.razorpay_payment_id = payment.id;
                transaction.payment_details = {
                    method: payment.method,
                    bank: payment.bank,
                    wallet: payment.wallet,
                    vpa: payment.vpa,
                    card_id: payment.card_id,
                    bank_transaction_id: payment.bank_transaction_id
                };
                transaction.completed_at = new Date();
                
                // Here you can add additional logic like sending confirmation emails,
                // creating registration records, etc.
                console.log(`Payment captured for order: ${orderId}`);
                break;

            case 'payment.failed':
                // Payment failed
                transaction.status = 'failed';
                transaction.error = {
                    code: payment.error_code,
                    description: payment.error_description,
                    source: payment.error_source,
                    reason: payment.error_reason
                };
                console.error(`Payment failed for order: ${orderId}`, transaction.error);
                break;

            default:
                console.log(`Unhandled webhook event: ${event}`);
                return res.status(200).json({ status: 'received' });
        }

        await transaction.save();
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('Webhook processing failed:', error);
        return res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
    }
});
