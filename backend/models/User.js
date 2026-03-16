import mongoose from 'mongoose';

const ROLES = ['user', 'admin'];
const POSITIONS = ['left', 'right'];

const userSchema = new mongoose.Schema(
  {
    name: {
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
    panNumber: {
      type: String,
      trim: true,
      default: '',
      required: true,
    },
    bankAccountNumber: {
      type: String,
      trim: true,
      default: '',
      required: true,
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
