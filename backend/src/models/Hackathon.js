const mongoose = require('mongoose');
const { Schema } = mongoose;

const hackathonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  organizer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  discord_link: { type: String },
  status: { type: String, enum: ['upcoming', 'ongoing', 'ended'], default: 'upcoming' },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'usd' }
});

module.exports = mongoose.model('Hackathon', hackathonSchema);
