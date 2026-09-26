import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default_config'
    },
    // SLA Configuration (Hours)
    normalSlaHours: {
      type: Number,
      default: 48
    },
    mediumSlaHours: {
      type: Number,
      default: 24
    },
    criticalSlaHours: {
      type: Number,
      default: 12
    },
    slaWarningHours: {
      type: Number,
      default: 6
    },
    // Reminders
    firstReminderHours: {
      type: Number,
      default: 0
    },
    secondReminderHours: {
      type: Number,
      default: 6
    },
    // Green Points Rewards
    reportRewardPoints: {
      type: Number,
      default: 10
    },
    verificationRewardPoints: {
      type: Number,
      default: 50
    },
    // AI Thresholds
    duplicateSimilarityThreshold: {
      type: Number,
      default: 80
    },
    invalidConfidenceThreshold: {
      type: Number,
      default: 35
    }
  },
  {
    timestamps: true
  }
);

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
