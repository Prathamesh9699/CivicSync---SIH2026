import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    beforeImage: {
      type: String,
      default: ''
    },
    afterImage: {
      type: String,
      default: ''
    },
    visualImprovementScore: {
      type: Number,
      default: 92
    },
    wasteClearanceConfidence: {
      type: Number,
      default: 96
    },
    verificationType: {
      type: String,
      enum: ['municipal_officer', 'citizen', 'ai_automated'],
      default: 'citizen'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_recleaning'],
      default: 'pending'
    },
    comments: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Verification = mongoose.model('Verification', verificationSchema);
