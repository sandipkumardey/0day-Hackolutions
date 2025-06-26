const mongoose = require('mongoose');
const { Schema } = mongoose;

const payoutSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hackathon_id: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['razorpay', 'crypto'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  transaction_id: { type: String },
  wallet_address: { type: String } // Can be bank details or crypto wallet
});

module.exports = mongoose.model('Payout', payoutSchema);
