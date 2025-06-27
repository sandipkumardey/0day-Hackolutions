import { Request, Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Payout from '../models/Payout';
import Transaction from '../models/Transaction';
import User from '../models/User';
import Hackathon from '../models/Hackathon';
import Team from '../models/Team';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// @desc    Create a payout to a winner
// @route   POST /api/payouts
// @access  Private/Admin
export const createPayout = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { hackathonId, teamId, amount, type, notes } = req.body;
  
  // Validate input
  if (!hackathonId || !teamId || !amount || !type) {
    return next(new ErrorResponse('Missing required fields', 400));
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get hackathon and team
    const hackathon = await Hackathon.findById(hackathonId).session(session);
    const team = await Team.findById(teamId).session(session);
    
    if (!hackathon) {
      await session.abortTransaction();
      return next(new ErrorResponse('Hackathon not found', 404));
    }
    
    if (!team) {
      await session.abortTransaction();
      return next(new ErrorResponse('Team not found', 404));
    }

    // Get team leader's bank details
    const teamLeader = await User.findById(team.leader).session(session);
    if (!teamLeader || !teamLeader.bankDetails || teamLeader.bankDetails.length === 0) {
      await session.abortTransaction();
      return next(new ErrorResponse('Team leader bank details not found', 400));
    }

    // Get the first bank details entry
    const bankDetails = teamLeader.bankDetails[0];

    // Create a payout record
    const payout = await Payout.create([{
      user: team.leader,
      hackathon: hackathonId,
      team: teamId,
      amount,
      type,
      status: 'pending',
      payment_details: {
        account_number: bankDetails.accountNumber,
        ifsc: bankDetails.ifscCode,
        name: bankDetails.accountHolderName,
        contact: teamLeader.phone,
        email: teamLeader.email
      },
      metadata: {
        notes,
        hackathon_name: hackathon.title, // Changed from name to title to match Hackathon model
        team_name: team.name
      },
      created_by: req.user.id
    }], { session });

    // Create a transaction record
    const transaction = await Transaction.create([{
      user: team.leader,
      hackathon: hackathonId,
      team: teamId,
      amount: -amount, // Negative amount for payout
      currency: 'INR',
      status: 'pending',
      type: 'payout',
      payment_details: {
        ...payout[0].payment_details,
        method: 'bank_transfer'
      },
      metadata: {
        payout_id: payout[0]._id,
        notes: `Payout for ${hackathon.title} - ${team.name}`
      }
    }], { session });

    // Initiate the actual payout via Razorpay
    const payoutData = {
      account_number: bankDetails.accountNumber,
      fund_account: {
        account_type: 'bank_account',
        bank_account: {
          name: bankDetails.accountHolderName,
          ifsc: bankDetails.ifscCode,
          account_number: bankDetails.accountNumber
        },
        contact: {
          name: teamLeader.name,
          email: teamLeader.email,
          contact: teamLeader.phone,
          type: 'vendor'
        }
      },
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: `payout_${Date.now()}`,
      narration: `Prize money for ${hackathon.title}`,
      notes: {
        team: team.name,
        hackathon: hackathon.title,
        position: type === 'prize' ? 'Winner' : 'Other'
      }
    };

    // Use type assertion for Razorpay payouts
    const razorpayPayout = await (razorpay as any).payouts.create(payoutData);

    // Update payout and transaction with Razorpay details
    payout[0].razorpay_payout_id = razorpayPayout.id;
    (payout[0] as any).status = 'processing';
    payout[0].processed_at = new Date();
    
    transaction[0].razorpay_payout_id = razorpayPayout.id;
    (transaction[0] as any).status = 'pending'; // Changed from 'processing' to 'pending' to match Transaction status type
    
    await Promise.all([
      payout[0].save({ session }),
      transaction[0].save({ session })
    ]);

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: {
        payout: payout[0],
        transaction: transaction[0]
      }
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Payout creation failed:', error);
    next(new ErrorResponse(`Payout failed: ${error.message}`, 500));
  } finally {
    session.endSession();
  }
});

// @desc    Handle Razorpay payout webhook
// @route   POST /api/payouts/webhook
// @access  Public
export const handlePayoutWebhook = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not set');
    return res.status(500).json({ status: 'error', message: 'Server configuration error' });
  }

  // Verify webhook signature
  const signature = req.headers['x-razorpay-signature'] as string;
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
  const payload = req.body.payload.payout?.entity;

  if (!payload) {
    console.error('No payout data in webhook payload');
    return res.status(400).json({ status: 'error', message: 'No payout data' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the payout and transaction
    const payout = await Payout.findOne({ razorpay_payout_id: payload.id }).session(session);
    
    if (!payout) {
      await session.abortTransaction();
      console.error(`Payout not found for ID: ${payload.id}`);
      return res.status(404).json({ status: 'error', message: 'Payout not found' });
    }

    const transaction = await Transaction.findOne({ razorpay_payout_id: payload.id }).session(session);
    
    if (!transaction) {
      await session.abortTransaction();
      console.error(`Transaction not found for payout ID: ${payload.id}`);
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }

    // Update status based on webhook event
    switch (event) {
      case 'payout.initiated':
        payout.status = 'processing';
        transaction.status = 'pending';
        break;
        
      case 'payout.processed':
        payout.status = 'completed';
        payout.completed_at = new Date();
        transaction.status = 'captured';
        transaction.completed_at = new Date();
        break;
        
      case 'payout.reversed':
      case 'payout.failed':
        payout.status = 'failed';
        transaction.status = 'failed';
        payout.error = {
          code: payload.failure_reason?.code || 'unknown',
          description: payload.failure_reason?.description || 'Unknown error',
          source: 'razorpay',
          step: 'payout_processing'
        };
        transaction.error = {
          ...payout.error,
          step: 'transaction_processing'
        };
        break;
        
      default:
        console.log(`Unhandled payout event: ${event}`);
        await session.abortTransaction();
        return res.status(200).json({ status: 'received' });
    }

    await Promise.all([
      payout.save({ session }),
      transaction.save({ session })
    ]);

    await session.commitTransaction();
    
    console.log(`Processed payout webhook for ${payload.id}: ${event}`);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error processing payout webhook:', error);
    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  } finally {
    session.endSession();
  }
});

// @desc    Get all payouts
// @route   GET /api/payouts
// @access  Private/Admin
export const getPayouts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Pagination
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Payout.countDocuments();

  // Build query
  const query: any = {};
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.hackathon) {
    query.hackathon = req.query.hackathon;
  }
  
  if (req.query.team) {
    query.team = req.query.team;
  }
  
  if (req.query.user) {
    query.user = req.query.user;
  }

  // Execute query
  const payouts = await Payout.find(query)
    .populate('user', 'name email')
    .populate('hackathon', 'name')
    .populate('team', 'name')
    .populate('created_by', 'name email')
    .sort('-created_at')
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination: any = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: payouts.length,
    pagination,
    data: payouts
  });
});

// @desc    Get single payout
// @route   GET /api/payouts/:id
// @access  Private/Admin
export const getPayout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const payout = await Payout.findById(req.params.id)
    .populate('user', 'name email')
    .populate('hackathon', 'name')
    .populate('team', 'name')
    .populate('created_by', 'name email');

  if (!payout) {
    return next(new ErrorResponse(`Payout not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: payout
  });
});
