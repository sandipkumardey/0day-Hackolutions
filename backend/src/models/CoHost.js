const mongoose = require('mongoose');
const { Schema } = mongoose;

const coHostSchema = new Schema({
  hackathon_id: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

coHostSchema.index({ hackathon_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('CoHost', coHostSchema);
