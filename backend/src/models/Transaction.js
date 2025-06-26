const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    // User and Hackathon references
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    hackathon_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Hackathon',
        index: true
    },
    team_id: {
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
        enum: ['hackathon_registration', 'team_registration', 'other'], 
        required: true 
    },
    
    // Razorpay details
    razorpay_order_id: { 
        type: String,
        index: true
    },
    razorpay_payment_id: { 
        type: String,
        index: true
    },
    razorpay_signature: String,
    payment_details: {
        method: String,           // card, netbanking, upi, wallet, etc.
        bank: String,            // bank name for netbanking
        wallet: String,           // wallet name if payment method is wallet
        vpa: String,             // UPI VPA if payment method is UPI
        card_id: String,         // Razorpay card ID for card payments
        bank_transaction_id: String
    },
    error: {
        code: String,
        description: String,
        source: String,
        reason: String,
        step: String,
        field: String
    },
    
    // Metadata
    metadata: { type: Object },
    
    // Timestamps
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    },
    completed_at: Date,
    refunded_at: Date
}, {
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
transactionSchema.index({ user_id: 1, status: 1 });
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
transactionSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'refunded') {
        this.refunded_at = new Date();
    }
    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
