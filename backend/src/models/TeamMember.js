const mongoose = require('mongoose');
const { Schema } = mongoose;

const teamMemberSchema = new Schema({
  team_id: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

teamMemberSchema.index({ team_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
