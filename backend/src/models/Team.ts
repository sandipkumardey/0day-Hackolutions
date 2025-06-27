import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  hackathon: mongoose.Types.ObjectId;
  leader: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: 'member' | 'admin';
    joinedAt: Date;
  }>;
  description?: string;
  projectName?: string;
  projectDescription?: string;
  projectLink?: string;
  repoLink?: string;
  technologies?: string[];
  isActive: boolean;
  isWinner: boolean;
  prize?: {
    position: number;
    amount: number;
    currency: string;
    distributed: boolean;
    distributedAt?: Date;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Team name cannot be more than 50 characters']
    },
    hackathon: {
      type: Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
      index: true
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['member', 'admin'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    projectName: {
      type: String,
      trim: true,
      maxlength: [100, 'Project name cannot be more than 100 characters']
    },
    projectDescription: {
      type: String,
      trim: true,
      maxlength: [2000, 'Project description cannot be more than 2000 characters']
    },
    projectLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, 'Please use a valid URL with HTTP/HTTPS']
    },
    repoLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\//, 'Please use a valid URL with HTTP/HTTPS']
    },
    technologies: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    isWinner: {
      type: Boolean,
      default: false
    },
    prize: {
      position: {
        type: Number,
        min: 1
      },
      amount: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'INR',
        uppercase: true
      },
      distributed: {
        type: Boolean,
        default: false
      },
      distributedAt: {
        type: Date
      }
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Ensure team names are unique per hackathon
teamSchema.index({ name: 1, hackathon: 1 }, { unique: true });

// Index for leader and members lookup
teamSchema.index({ leader: 1 });
teamSchema.index({ 'members.user': 1 });

// Virtual for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.length + 1; // +1 for the leader
});

// Pre-save hook to ensure leader is in members
// teamSchema.pre('save', async function(next) {
//   const isLeaderInMembers = this.members.some(member => 
//     member.user.toString() === this.leader.toString()
//   );

//   if (!isLeaderInMembers) {
//     this.members.unshift({
//       user: this.leader,
//       role: 'admin',
//       joinedAt: new Date()
//     });
//   }
//   next();
// });

const Team = mongoose.model<ITeam>('Team', teamSchema);

export default Team;
