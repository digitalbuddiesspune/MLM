import mongoose from 'mongoose';

const ROLES = ['user', 'admin'];
const POSITIONS = ['left', 'right'];
const KYC_STATUSES = ['none', 'pending', 'approved', 'rejected'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'user',
      required: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    position: {
      type: String,
      enum: POSITIONS,
      default: null,
    },
    leftChildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rightChildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
      required: true,
    },
    kycStatus: {
      type: String,
      enum: KYC_STATUSES,
      default: 'none',
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      required: true,
    },
    activationDate: {
      type: Date,
      default: null,
    },
    renewalDate: {
      type: Date,
      default: null,
    },
    walletBalance: {
      type: Number,
      default: 0,
      required: true,
    },
    rank: {
      type: String,
      default: 'Beginner',
      required: true,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 6,
      required: true,
    },
    sponsoredUsersCount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    levelReward: {
      type: String,
      default: '',
    },
    joiningBonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
