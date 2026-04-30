import crypto from 'crypto';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import { getRazorpayClient, getRazorpayKeyId, getRazorpayKeySecret } from '../config/razorpay.js';
import { addIncome } from '../services/walletService.js';

// Credit 5% on each eligible child order; left + right totals 10%.
const BINARY_PAIR_BONUS_PERCENT = 5;

async function removePurchasedProductFromCart(userId, productId) {
  if (!userId || !productId) return;
  await Cart.updateOne(
    { userId },
    { $pull: { items: { productId } } }
  );
}

async function creditBinaryPairBonusIfEligible(order) {
  if (!order || order.binaryPairBonusCreditedAt) return false;

  const buyer = await User.findById(order.userId)
    .select('parentId')
    .lean();

  if (!buyer?.parentId) return false;

  const parent = await User.findById(buyer.parentId)
    .select('_id leftChildId rightChildId')
    .lean();

  const hasBothChildren = Boolean(parent?.leftChildId && parent?.rightChildId);
  if (!parent?._id || !hasBothChildren) return false;

  const bonusAmount = Number((((order.amount ?? 0) * BINARY_PAIR_BONUS_PERCENT) / 100).toFixed(2));
  if (bonusAmount <= 0) return false;

  await addIncome(parent._id, bonusAmount, 'binary', order._id);
  order.binaryPairBonusAmount = bonusAmount;
  order.binaryPairBonusUserId = parent._id;
  order.binaryPairBonusCreditedAt = new Date();
  return true;
}

export async function createOrder(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, error: 'Valid productId is required' });
    }

    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const amount = Number(product.price ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid product amount' });
    }

    const client = getRazorpayClient();
    const receipt = `ord_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    const razorpayOrder = await client.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt,
    });

    const created = await Order.create({
      userId: req.userId,
      productId: product._id,
      productSnapshot: {
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl ?? '',
        businessVolume: product.businessVolume ?? 0,
      },
      amount: product.price,
      currency: 'INR',
      status: 'pending',
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(201).json({
      success: true,
      data: {
        order: created,
        razorpayOrder,
        razorpayKeyId: getRazorpayKeyId(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOrderPayment(req, res, next) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, error: 'Valid orderId is required' });
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, error: 'Payment verification fields are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const isOwner = String(order.userId) === String(req.userId);
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Not authorized for this order' });
    }
    if (order.status === 'paid') {
      const changed = await creditBinaryPairBonusIfEligible(order);
      if (changed) {
        await order.save();
      }
      await removePurchasedProductFromCart(order.userId, order.productId);
      return res.json({ success: true, data: { order } });
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', getRazorpayKeySecret())
      .update(payload)
      .digest('hex');

    if (expected !== razorpaySignature || order.razorpayOrderId !== razorpayOrderId) {
      order.status = 'failed';
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature;
      await order.save();
      return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
    }

    order.status = 'paid';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paidAt = new Date();

    await creditBinaryPairBonusIfEligible(order);

    await order.save();
    await removePurchasedProductFromCart(order.userId, order.productId);

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: { orders } });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const status = (req.query.status || '').trim();

    const filter = {};
    if (status && ['pending', 'paid', 'failed'].includes(status)) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
