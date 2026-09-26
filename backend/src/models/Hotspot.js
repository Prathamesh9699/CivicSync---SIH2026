import mongoose from 'mongoose';

const hotspotSchema = new mongoose.Schema(
  {
    hotspotId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    ward: {
      type: String,
      required: true,
      index: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'High'
    },
    severityScore: {
      type: Number,
      default: 75
    },
    color: {
      type: String,
      default: '#ea580c'
    },
    totalComplaints: {
      type: Number,
      default: 0
    },
    activeComplaints: {
      type: Number,
      default: 0
    },
    resolvedComplaints: {
      type: Number,
      default: 0
    },
    primaryWasteType: {
      type: String,
      default: 'Plastic & Beverage Containers'
    },
    condition: {
      type: String,
      default: 'Roadside dumping'
    },
    recurrenceRate: {
      type: String,
      default: 'High (78%)'
    },
    lastCleanedDaysAgo: {
      type: Number,
      default: 2
    },
    cleanlinessRating: {
      type: Number,
      default: 60
    },
    aiRootCause: {
      type: String,
      default: ''
    },
    recommendedAction: {
      type: String,
      default: ''
    },
    historicalTrend: [
      {
        month: String,
        complaints: Number
      }
    ],
    status: {
      type: String,
      enum: ['active', 'monitoring', 'resolved'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

hotspotSchema.index({ location: '2dsphere' });

export const Hotspot = mongoose.model('Hotspot', hotspotSchema);
