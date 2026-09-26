import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    targetRole: {
      type: String,
      enum: ['citizen', 'municipal_staff', 'administrator', 'all'],
      default: 'citizen'
    },
    complaintId: {
      type: String,
      default: null
    },
    type: {
      type: String,
      enum: [
        'complaint_created',
        'complaint_assigned',
        'complaint_updated',
        'sla_warning',
        'sla_escalated',
        'cleanup_completed',
        'citizen_verification_required',
        'complaint_resolved',
        'green_points_awarded',
        'system_alert',
        'info',
        'alert',
        'success'
      ],
      default: 'info'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    link: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
