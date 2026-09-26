import mongoose from 'mongoose';

const timelineStepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    time: { type: String, default: 'Just now' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['completed', 'current', 'pending', 'skipped'], default: 'pending' }
  },
  { _id: false }
);

const priorityHistoryItemSchema = new mongoose.Schema(
  {
    previousLevel: { type: String, default: 'NORMAL' },
    newLevel: { type: String, required: true },
    reason: { type: String, default: 'SLA Escalation' },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      default: ''
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    citizenName: {
      type: String,
      default: 'Citizen'
    },
    citizenPhone: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      required: [true, 'Complaint photo is required']
    },
    additionalImages: [{ type: String }],
    beforeImageUrl: {
      type: String,
      default: ''
    },
    afterImageUrl: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    citizenNotes: {
      type: String,
      default: ''
    },

    // GeoJSON Location
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [73.8567, 18.5204]
      },
      address: { type: String, default: '' },
      ward: { type: String, default: 'Ward 12 - Shivaji Nagar', index: true },
      landmark: { type: String, default: '' }
    },
    // Compatibility fields for existing UI
    latitude: { type: Number, default: 18.5204 },
    longitude: { type: Number, default: 73.8567 },
    ward: { type: String, default: 'Ward 12 - Shivaji Nagar' },
    landmark: { type: String, default: '' },

    // Waste Taxonomy
    waste: {
      category: { type: String, default: 'Plastic Waste' },
      categoryId: { type: String, default: '02' },
      subtype: { type: String, default: 'PET Bottle' },
      segregationStream: { type: String, default: 'Dry Waste → Plastic Recycling' },
      condition: { type: String, default: 'Roadside dumping' },
      conditionId: { type: String, default: 'roadside_dumping' }
    },
    // Compatibility fields for existing UI
    aiCategory: { type: String, default: 'Plastic Waste' },
    aiCategoryId: { type: String, default: '02' },
    aiSubtype: { type: String, default: 'PET Bottle & Plastic Packaging' },
    aiCondition: { type: String, default: 'Roadside dumping' },
    aiConditionId: { type: String, default: 'roadside_dumping' },
    segregationStream: { type: String, default: 'Dry Waste → Plastic Recycling' },

    // AI Analysis Reference & Scores
    ai: {
      confidence: { type: Number, default: 94 },
      analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIAnalysis' },
      duplicateScore: { type: Number, default: 0 },
      recurrenceScore: { type: Number, default: 0 }
    },
    aiConfidence: { type: Number, default: 94 },

    // Multi-Stream Detection & Biodegradability Metrics
    estimatedVolumeLiters: { type: Number },
    estimatedVolumeM3: { type: Number },
    estimatedWeightKg: { type: Number },
    estimatedWeightGrams: { type: Number },
    plasticVolumeLiters: { type: Number },
    plasticWeightKg: { type: Number },
    medicalVolumeLiters: { type: Number },
    medicalWeightKg: { type: Number },
    ewasteVolumeLiters: { type: Number },
    ewasteWeightKg: { type: Number },
    containerRequirement: { type: String },
    humanReadableVolume: { type: String },
    totalItemsDetected: { type: Number },
    wasteCoveragePercent: { type: Number },
    plasticCoveragePercent: { type: Number },
    medicalCoveragePercent: { type: Number },
    ewasteCoveragePercent: { type: Number },
    biodegradableCoveragePercent: { type: Number },
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
    model: { type: String },

    // Priority & Scoring
    priority: {
      level: {
        type: String,
        enum: ['NORMAL', 'MEDIUM', 'CRITICAL', 'HIGH', 'LOW', 'High', 'Low', 'Critical', 'Medium', 'Normal'], // Flexible for UI
        default: 'Medium',
        index: true
      },
      score: { type: Number, default: 75 },
      reason: { type: String, default: 'Initial AI Assessment' }
    },
    severity: { type: String, default: 'High' }, // Compatibility with existing UI badge
    aiPriorityScore: { type: Number, default: 75 },
    severityBreakdown: {
      wasteTypeScore: { type: Number, default: 20 },
      visualExtentScore: { type: Number, default: 24 },
      locationSensitivityScore: { type: Number, default: 20 },
      recurrenceScore: { type: Number, default: 15 },
      timeFactorScore: { type: Number, default: 5 }
    },
    priorityHistory: [priorityHistoryItemSchema],

    // SLA & Time-Based Deadlines
    sla: {
      createdAt: { type: Date, default: Date.now },
      dueAt: { type: Date, required: true, index: true },
      escalationLevel: { type: Number, default: 0 },
      lastReminderAt: { type: Date, default: null },
      reminderCount: { type: Number, default: 0 },
      escalatedAt: { type: Date, default: null },
      isOverdue: { type: Boolean, default: false }
    },

    // Duplicate & Recurrence
    duplicateDetection: {
      hasDuplicate: { type: Boolean, default: false },
      similarityScore: { type: Number, default: 0 },
      duplicateCount: { type: Number, default: 0 },
      duplicateIds: [{ type: String }],
      primaryClusterId: { type: String, default: null },
      aiMergeRecommendation: { type: String, default: '' }
    },
    recurrenceDetection: {
      isRecurring: { type: Boolean, default: false },
      recurrenceLevel: { type: String, default: 'Low' },
      pastCleanupsCount: { type: Number, default: 0 },
      lastCleanedDaysAgo: { type: Number, default: 0 },
      rootCauseInference: { type: String, default: '' }
    },
    aiRecommendation: {
      action: { type: String, default: '' },
      recommendedTeam: { type: String, default: '' },
      equipmentNeeded: [{ type: String }],
      officerNote: { type: String, default: '' }
    },

    // Workflow Status
    status: {
      type: String,
      enum: [
        'reported',
        'ai_analyzed',
        'under_review',
        'assigned',
        'in_progress',
        'awaiting_verification',
        'resolved',
        'citizen_verified',
        'rejected',
        // Also support Capitalized variations matching existing UI
        'Reported',
        'AI Analyzed',
        'Under Review',
        'Assigned',
        'In Progress',
        'Awaiting Verification',
        'Resolved',
        'Citizen Verified',
        'Rejected'
      ],
      default: 'AI Analyzed',
      index: true
    },

    // Workforce Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedWorkerId: { type: String, default: null },
    assignedWorkerName: { type: String, default: null },
    assignedWorkerPhone: { type: String, default: '' },
    assignedTeamId: { type: String, default: null },
    assignedTeamName: { type: String, default: null },
    assignedOfficer: { type: String, default: 'Vikram Deshmukh (Zonal Triage)' },
    officerNote: { type: String, default: '' },

    // Worker Evidence Photo & Completion Metadata
    workerEvidence: {
      photoUrl: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
      workerId: { type: String, default: '' },
      workerName: { type: String, default: '' },
      notes: { type: String, default: '' },
      equipmentUsed: [{ type: String }],
      wasteVolumeCollected: { type: String, default: '' }
    },

    // Verification & Green Points
    citizenVerification: {
      isClean: { type: Boolean, default: false },
      notes: { type: String, default: '' },
      verifiedAt: { type: Date, default: null }
    },
    isVerifiedByCitizen: { type: Boolean, default: false },
    greenPointsAwarded: { type: Number, default: 50 },

    // Invalid Filter
    isFlaggedInvalid: { type: Boolean, default: false },
    invalidReason: { type: String, default: '' },

    timeline: [timelineStepSchema],
    resolvedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

// 2dsphere Geospatial index for proximity queries & duplicate detection
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ createdAt: -1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
