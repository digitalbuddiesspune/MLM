import mongoose from 'mongoose';

const payoutRunSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
    },
    entryCount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    report: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

payoutRunSchema.index({ year: 1, month: 1 }, { unique: true });

const PayoutRun = mongoose.model('PayoutRun', payoutRunSchema);

export default PayoutRun;
