import mongoose from 'mongoose';

const ORDER_STATUSES = ['pending', 'paid', 'failed'];

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      imageUrl: { type: String, default: '' },
      businessVolume: { type: Number, default: 0 },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    binaryPairBonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    binaryPairBonusUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    binaryPairBonusCreditedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
