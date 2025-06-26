const mongoose = require('mongoose');
const { Schema } = mongoose;

const teamSchema = new Schema({
  hackathon_id: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  team_name: { type: String, required: true },
  leader_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project_link: { type: String }
});

teamSchema.index({ hackathon_id: 1, team_name: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
