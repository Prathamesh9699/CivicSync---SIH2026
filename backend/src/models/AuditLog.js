import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    userName: {
      type: String,
      default: 'System Automator'
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_REGISTERED',
        'USER_LOGIN',
        'ROLE_CHANGED',
        'USER_STATUS_TOGGLED',
        'COMPLAINT_CREATED',
        'COMPLAINT_ASSIGNED',
        'PRIORITY_ESCALATED',
        'SLA_WARNING_SENT',
        'STATUS_UPDATED',
        'COMPLAINT_RESOLVED',
        'COMPLAINT_REJECTED',
        'VERIFICATION_APPROVED',
        'VERIFICATION_REJECTED',
        'DUPLICATES_MERGED',
        'SETTINGS_UPDATED',
        'SYSTEM_INITIALIZED',
        'TEST_ESCALATION_TRIGGERED'
      ],
      index: true
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    detail: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
