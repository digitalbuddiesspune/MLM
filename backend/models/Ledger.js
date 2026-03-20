import mongoose from 'mongoose';

const LEDGER_TYPES = ['binary', 'generation', 'royalty', 'withdrawal', 'joining_bonus'];
const LEDGER_STATUSES = ['pending', 'completed', 'failed'];

const ledgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: LEDGER_TYPES,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: LEDGER_STATUSES,
      default: 'completed',
    },
    payoutRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutRun',
      default: null,
    },
  },
  { timestamps: true }
);

const Ledger = mongoose.model('Ledger', ledgerSchema);

export default Ledger;
