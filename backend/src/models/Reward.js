import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    complaintId: {
      type: String,
      default: null
    },
    type: {
      type: String,
      enum: [
        'report_submitted',
        'cleanup_verified',
        'community_contribution',
        'bonus',
        'redeem'
      ],
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent double reward awarding on the same complaint and type
rewardSchema.index({ userId: 1, complaintId: 1, type: 1 });

export const Reward = mongoose.model('Reward', rewardSchema);
