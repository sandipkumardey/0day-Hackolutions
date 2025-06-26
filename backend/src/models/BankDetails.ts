import mongoose, { Document, Schema } from 'mongoose';

export interface IBankDetails extends Document {
  user: mongoose.Types.ObjectId;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch?: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const bankDetailsSchema = new Schema<IBankDetails>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    bankName: {
      type: String,
      required: true,
      trim: true
    },
    branch: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date
    },
    metadata: {
      type: Schema.Types.Mixed
    }
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

// Ensure a user can only have one primary account
bankDetailsSchema.index(
  { user: 1, isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

// Ensure account number is unique per user
bankDetailsSchema.index(
  { user: 1, accountNumber: 1 },
  { unique: true }
);

// Pre-save hook to handle primary account logic
bankDetailsSchema.pre('save', async function (next) {
  if (this.isPrimary) {
    // If this is being set as primary, unset any existing primary account
    await this.model('BankDetails').updateMany(
      { user: this.user, isPrimary: true, _id: { $ne: this._id } },
      { $set: { isPrimary: false } }
    );
  }
  next();
});

const BankDetails = mongoose.model<IBankDetails>('BankDetails', bankDetailsSchema);

export default BankDetails;
