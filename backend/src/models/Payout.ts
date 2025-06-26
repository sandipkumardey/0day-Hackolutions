import mongoose, { Document, Schema } from 'mongoose';

export interface IPayout extends Document {
  user: mongoose.Types.ObjectId;
  hackathon: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'prize' | 'refund' | 'other';
  razorpay_payout_id?: string;
  payment_details?: {
    account_number: string;
    ifsc: string;
    name: string;
    contact?: string;
    email?: string;
  };
  metadata?: Record<string, any>;
  processed_at?: Date;
  completed_at?: Date;
  error?: {
    code: string;
    description: string;
    source: string;
    step: string;
  };
  created_by: mongoose.Types.ObjectId;
}

const payoutSchema = new Schema<IPayout>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hackathon: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR', uppercase: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['prize', 'refund', 'other'],
      required: true,
    },
    razorpay_payout_id: String,
    payment_details: {
      account_number: { type: String, required: true },
      ifsc: { type: String, required: true },
      name: { type: String, required: true },
      contact: String,
      email: String,
    },
    metadata: { type: Object },
    processed_at: Date,
    completed_at: Date,
    error: {
      code: String,
      description: String,
      source: String,
      step: String,
    },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
payoutSchema.index({ user: 1, status: 1 });
payoutSchema.index({ hackathon: 1 });
payoutSchema.index({ team: 1 });
payoutSchema.index({ razorpay_payout_id: 1 }, { unique: true, sparse: true });

// Virtual for formatted amount
payoutSchema.virtual('formatted_amount').get(function () {
  return {
    value: this.amount,
    display: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(this.amount),
  };
});

const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
export default Payout;
