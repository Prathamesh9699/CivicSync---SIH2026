import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      default: ''
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      enum: ['citizen', 'municipal_staff', 'worker', 'administrator', 'admin'],
      default: 'citizen',
      index: true
    },
    assignedSquad: {
      type: String,
      default: ''
    },
    assignedTeamId: {
      type: String,
      default: 'team_alpha'
    },
    shift: {
      type: String,
      default: 'Morning (06:00 - 14:00)'
    },
    vehicleAssigned: {
      type: String,
      default: 'MH-12-QX-4012'
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    ward: {
      type: String,
      default: 'Ward 12 - Shivaji Nagar'
    },
    municipality: {
      type: String,
      default: 'Pune Municipal Corporation'
    },
    designation: {
      type: String,
      default: 'Citizen Contributor'
    },
    department: {
      type: String,
      default: 'Civic Community'
    },
    address: {
      type: String,
      default: ''
    },
    greenPoints: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    levelTitle: {
      type: String,
      default: 'Green Starter'
    },
    badges: [
      {
        id: String,
        name: String,
        icon: String,
        earnedDate: String,
        description: String
      }
    ],
    stats: {
      reportsSubmitted: { type: Number, default: 0 },
      reportsVerified: { type: Number, default: 0 },
      cleanupConfirmations: { type: Number, default: 0 },
      communityImpactScore: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Do not return passwordHash in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model('User', userSchema);
