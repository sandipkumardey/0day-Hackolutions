import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  // User and Hackathon references
  user: mongoose.Types.ObjectId;
  hackathon?: mongoose.Types.ObjectId;
  team?: mongoose.Types.ObjectId;
  
  // Payment details
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'disputed';
  type: 'hackathon_registration' | 'team_registration' | 'other' | 'payout';
  
  // Razorpay details
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  razorpay_payout_id?: string;
  
  // Payment method details
  payment_details?: {
    method?: string;
    bank?: string;
    wallet?: string;
    vpa?: string;
    card_id?: string;
    bank_transaction_id?: string;
    account_number?: string;
    ifsc?: string;
    name?: string;
    contact?: string;
    email?: string;
  };
  
  // Error details if any
  error?: {
    code?: string;
    description?: string;
    source?: string;
    reason?: string;
    step?: string;
    field?: string;
  };
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  refunded_at?: Date;
  
  // Virtuals
  formatted_amount: {
    value: number;
    display: string;
  };
}

const transactionSchema = new Schema<ITransaction>(
  {
    // User and Hackathon references
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    hackathon: { 
      type: Schema.Types.ObjectId, 
      ref: 'Hackathon',
      index: true
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    
    // Payment details
    amount: { 
      type: Number, 
      required: true 
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    status: { 
      type: String, 
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded', 'disputed'], 
      default: 'pending' 
    },
    type: { 
      type: String, 
      enum: ['hackathon_registration', 'team_registration', 'other', 'payout'], 
      required: true 
    },
    
    // Razorpay details
    razorpay_order_id: { 
      type: String,
      index: true,
      sparse: true
    },
    razorpay_payment_id: { 
      type: String,
      index: true,
      sparse: true
    },
    razorpay_signature: String,
    razorpay_payout_id: {
      type: String,
      index: true,
      sparse: true
    },
    
    // Payment method details
    payment_details: {
      method: String,           // card, netbanking, upi, wallet, etc.
      bank: String,            // bank name for netbanking
      wallet: String,           // wallet name if payment method is wallet
      vpa: String,             // UPI VPA if payment method is UPI
      card_id: String,         // Razorpay card ID for card payments
      bank_transaction_id: String,
      // For payouts
      account_number: String,
      ifsc: String,
      name: String,
      contact: String,
      email: String
    },
    
    // Error details
    error: {
      code: String,
      description: String,
      source: String,
      reason: String,
      step: String,
      field: String
    },
    
    // Metadata
    metadata: { type: Object }
  },
  {
    timestamps: { 
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ created_at: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formatted_amount').get(function() {
  return {
    value: this.amount,
    display: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(this.amount)
  };
});

// Pre-save hook to update timestamps
transactionSchema.pre('save', function(this: ITransaction, next) {
  if (this.isModified('status') && (this.status === 'refunded' || this.status === 'captured')) {
    if (!this.completed_at) {
      this.completed_at = new Date();
    }
  }
  next();
});

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
