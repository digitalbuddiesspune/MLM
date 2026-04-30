import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    guestIp: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    guestId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } });
cartSchema.index({ guestIp: 1 }, { unique: true, partialFilterExpression: { guestIp: { $type: 'string', $ne: '' } } });
cartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: 'string', $ne: '' } } });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
