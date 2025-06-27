const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, enum: ['email', 'discord', 'web'], required: true },
  message: { type: String, required: true },
  sent_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed', 'read'], default: 'sent' }
});

module.exports = mongoose.model('Notification', notificationSchema);
