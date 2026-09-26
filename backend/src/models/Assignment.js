import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    teamId: {
      type: String,
      default: 'team_alpha'
    },
    teamName: {
      type: String,
      required: true,
      default: 'Team Alpha'
    },
    instructions: {
      type: String,
      default: ''
    },
    priorityOverride: {
      type: String,
      default: 'High'
    },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'assigned'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);
