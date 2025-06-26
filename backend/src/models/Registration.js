const mongoose = require('mongoose');
const { Schema } = mongoose;

const registrationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hackathon_id: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  type: { type: String, enum: ['individual', 'team'], required: true },
  status: { type: String, enum: ['registered', 'verified', 'rejected'], default: 'registered' },
  editable_until: { type: Date }
});

registrationSchema.index({ user_id: 1, hackathon_id: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
