import mongoose from 'mongoose';

const binaryStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    leftBV: {
      type: Number,
      default: 0,
      min: 0,
    },
    rightBV: {
      type: Number,
      default: 0,
      min: 0,
    },
    leftCarry: {
      type: Number,
      default: 0,
      min: 0,
    },
    rightCarry: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMatchedPairs: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const BinaryStats = mongoose.model('BinaryStats', binaryStatsSchema);

export default BinaryStats;
