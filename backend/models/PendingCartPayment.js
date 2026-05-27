import mongoose from 'mongoose';

const pendingCartLineSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    productSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      imageUrl: { type: String, default: '' },
      businessVolume: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const pendingCartPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [pendingCartLineSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const PendingCartPayment = mongoose.model('PendingCartPayment', pendingCartPaymentSchema);

export default PendingCartPayment;
