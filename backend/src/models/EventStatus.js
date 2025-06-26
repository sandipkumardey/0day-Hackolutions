const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventStatusSchema = new Schema({
  hackathon_id: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  phase: { type: String, required: true }, // e.g., 'Registration Open', 'Hacking Started', 'Judging'
  current: { type: Boolean, default: false },
  updated_at: { type: Date, default: Date.now }
});

eventStatusSchema.index({ hackathon_id: 1, phase: 1 }, { unique: true });

module.exports = mongoose.model('EventStatus', eventStatusSchema);
