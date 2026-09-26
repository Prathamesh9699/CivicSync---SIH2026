import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      index: true
    },
    modelVersion: {
      type: String,
      default: 'YOLOv8x-ViT-v2.4.0'
    },
    category: {
      type: String,
      required: true
    },
    categoryId: {
      type: String,
      default: '02'
    },
    subtype: {
      type: String,
      default: ''
    },
    confidence: {
      type: Number,
      required: true
    },
    condition: {
      type: String,
      default: 'Roadside dumping'
    },
    conditionId: {
      type: String,
      default: 'roadside_dumping'
    },
    segregationStream: {
      type: String,
      default: 'Dry Waste → Plastic Recycling'
    },
    severityScore: {
      type: Number,
      default: 80
    },
    priorityLevel: {
      type: String,
      enum: ['NORMAL', 'MEDIUM', 'CRITICAL', 'HIGH', 'LOW', 'Critical', 'High', 'Medium', 'Low', 'Normal'],
      default: 'Medium'
    },
    severityBreakdown: {
      wasteTypeScore: { type: Number, default: 20 },
      visualExtentScore: { type: Number, default: 24 },
      locationSensitivityScore: { type: Number, default: 20 },
      recurrenceScore: { type: Number, default: 15 },
      timeFactorScore: { type: Number, default: 5 }
    },
    duplicateDetection: {
      hasDuplicate: { type: Boolean, default: false },
      similarityScore: { type: Number, default: 0 },
      duplicateCount: { type: Number, default: 0 },
      duplicateIds: [{ type: String }],
      primaryClusterId: { type: String, default: null }
    },
    recurrenceDetection: {
      isRecurring: { type: Boolean, default: false },
      recurrenceLevel: { type: String, default: 'Low' },
      pastCleanupsCount: { type: Number, default: 0 },
      lastCleanedDaysAgo: { type: Number, default: 0 },
      rootCauseInference: { type: String, default: '' }
    },
    recommendation: {
      action: { type: String, default: '' },
      recommendedTeam: { type: String, default: '' },
      equipmentNeeded: [{ type: String }],
      disclaimer: {
        type: String,
        default: 'AI-assisted classification. Final decision rests with municipal authority.'
      }
    },
    totalItemsDetected: { type: Number, default: 0 },
    detections: { type: Array, default: [] },
    countsByClass: { type: mongoose.Schema.Types.Mixed, default: {} },
    plasticCountsByClass: { type: mongoose.Schema.Types.Mixed, default: {} },
    biomedicalCountsByClass: { type: mongoose.Schema.Types.Mixed, default: {} },
    ewasteCountsByClass: { type: mongoose.Schema.Types.Mixed, default: {} },
    biodegradableCountsByClass: { type: mongoose.Schema.Types.Mixed, default: {} },
    degradableCountsByClass: { type: mongoose.Schema.Types.Mixed, default: {} },
    nonBiodegradableCountsByClass: { type: mongoose.Schema.Types.Mixed, default: {} },
    biodegradableDetectionsCount: { type: Number, default: 0 },
    degradableDetectionsCount: { type: Number, default: 0 },
    nonBiodegradableDetectionsCount: { type: Number, default: 0 },
    biodegradabilityAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    circularEconomy: { type: mongoose.Schema.Types.Mixed, default: null },
    municipalAction: { type: mongoose.Schema.Types.Mixed, default: null },
    processingTimeMs: {
      type: Number,
      default: 142
    },
    isFlaggedInvalid: {
      type: Boolean,
      default: false
    },
    invalidReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);
