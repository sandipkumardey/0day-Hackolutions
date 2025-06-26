const mongoose = require('mongoose');
const { Schema } = mongoose;

const profileSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String },
  skills: [{ type: String }],
  avatar_url: { type: String },
  sms_opt_in: { type: Boolean, default: false },
  newsletter_subscribed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Profile', profileSchema);
