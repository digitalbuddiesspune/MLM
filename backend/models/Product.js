import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    businessVolume: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'BV used for binary/generation commission calculation',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
