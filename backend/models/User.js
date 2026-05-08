import mongoose from 'mongoose';

const ROLES = ['user', 'admin'];
const PLACEMENT_SIDES = ['left', 'right'];
const KYC_STATUSES = ['none', 'pending', 'approved', 'rejected'];

const placementHistoryEntrySchema = new mongoose.Schema(
  {
    fromSponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    toSponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fromSide: { type: String, enum: [...PLACEMENT_SIDES, null], default: null },
    toSide: { type: String, enum: [...PLACEMENT_SIDES, null], default: null },
    fromIndex: { type: Number, default: null },
    toIndex: { type: Number, default: null },
    movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    movedAt: { type: Date, default: () => new Date() },
    reason: { type: String, default: '', trim: true },
  },
  { _id: false }
);

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
    /**
     * Actual registration sponsor / recruiter. This remains stable even when the
     * binary placement spills over into the sponsor's active placement path.
     */
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    leftChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rightChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    directSponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    /** Sequential placement order inside the unidirectional binary flow. */
    placementIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Side under the binary placement parent. */
    placementSide: {
      type: String,
      enum: PLACEMENT_SIDES,
      default: null,
      index: true,
    },
    pairMatched: {
      type: Boolean,
      default: false,
      index: true,
    },
    activePlacement: {
      type: Boolean,
      default: false,
      index: true,
    },
    placementSequence: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    binaryStatus: {
      type: String,
      enum: ['open_left', 'open_right', 'pair_matched', 'frozen'],
      default: 'open_left',
      index: true,
    },
    placementFrozen: {
      type: Boolean,
      default: false,
    },
    spilloverRedirect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    children: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    /** Counts of THIS user's direct children grouped by side. Maintained on placement / drag-drop. */
    binaryLeftCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    binaryRightCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pairCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    binaryIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    manualPlacement: {
      type: Boolean,
      default: false,
    },
    placementHistory: {
      type: [placementHistoryEntrySchema],
      default: [],
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
    /** Public numeric referral code for sponsor field (digits only). */
    referralNumber: {
      type: Number,
      unique: true,
      sparse: true,
      min: 100_001,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ sponsorId: 1, placementSequence: 1 });
userSchema.index({ parentId: 1, placementSide: 1 });
userSchema.index({ leftChild: 1 });
userSchema.index({ rightChild: 1 });
userSchema.index({ pairMatched: 1, activePlacement: 1 });

userSchema.virtual('position').get(function getPosition() {
  return this.placementSide ?? null;
});
userSchema.virtual('wallet').get(function getWalletBalance() {
  return this.walletBalance ?? 0;
});
userSchema.virtual('status').get(function getMembershipStatus() {
  return this.isActive ? 'active' : 'inactive';
});

userSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User;
