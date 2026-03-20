import mongoose from 'mongoose';

const KYC_STATUSES = ['pending', 'approved', 'rejected'];

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    aadhaarNumber: {
      type: String,
      required: true,
      trim: true,
    },
    aadhaarPhoto: {
      type: String,
      required: true,
    },
    panNumber: {
      type: String,
      required: true,
      trim: true,
    },
    panPhoto: {
      type: String,
      required: true,
    },
    bankProofPhoto: {
      type: String,
      required: true,
    },
    bankAccountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    branchName: {
      type: String,
      required: true,
      trim: true,
    },
    nomineeName: {
      type: String,
      required: true,
      trim: true,
    },
    nomineeRelation: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: KYC_STATUSES,
      default: 'pending',
      required: true,
    },
    adminRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Kyc = mongoose.model('Kyc', kycSchema);

export default Kyc;
