import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  if (raw && typeof raw === 'string') {
    return raw.split(',')[0].trim();
  }
  return req.ip ?? '';
}

function getGuestId(req) {
  const guestId = req.headers['x-guest-id'];
  if (typeof guestId === 'string') return guestId.trim();
  if (Array.isArray(guestId) && guestId[0]) return String(guestId[0]).trim();
  return '';
}

function getCartSelector(req) {
  if (req.userId) return { userId: req.userId };
  const guestId = getGuestId(req);
  if (guestId) return { guestId };
  return { guestIp: getClientIp(req) };
}

async function getOrCreateCart(req) {
  if (req.userId) {
    const guestId = getGuestId(req);
    const guestIp = getClientIp(req);
    let userCart = await Cart.findOne({ userId: req.userId });
    let guestCart = null;
    if (guestId) {
      guestCart = await Cart.findOne({ guestId });
    }
    // Backward compatibility: older guest carts may not have guestId.
    if (!guestCart && guestIp) {
      guestCart = await Cart.findOne({ guestIp });
    }

    // If no user cart exists, claim guest cart directly by attaching userId.
    if (!userCart && guestCart) {
      guestCart.userId = req.userId;
      guestCart.guestId = '';
      guestCart.guestIp = '';
      await guestCart.save();
      return guestCart;
    }

    if (!userCart) {
      userCart = await Cart.create({
        userId: req.userId,
        guestIp: '',
        guestId: '',
        items: [],
      });
    }

    if (guestCart && String(guestCart._id) !== String(userCart._id)) {
      for (const guestItem of guestCart.items) {
        const existing = userCart.items.find((item) => String(item.productId) === String(guestItem.productId));
        if (existing) {
          existing.quantity += guestItem.quantity;
        } else {
          userCart.items.push({ productId: guestItem.productId, quantity: guestItem.quantity });
        }
      }
      await userCart.save();
      await guestCart.deleteOne();
    }

    return userCart;
  }

  const selector = getCartSelector(req);
  let guestCart = await Cart.findOne(selector);
  if (!guestCart) {
    const guestId = getGuestId(req);
    const guestIp = getClientIp(req);
    guestCart = await Cart.create({
      userId: null,
      guestIp,
      guestId,
      items: [],
    });
  } else {
    const guestId = getGuestId(req);
    // Backfill guestId for existing IP-based carts so refresh/login stays stable.
    if (!guestCart.guestId && guestId) {
      guestCart.guestId = guestId;
      await guestCart.save();
    }
  }
  return guestCart;
}

async function populateAndFormatCart(cartId) {
  const cart = await Cart.findById(cartId)
    .populate({
      path: 'items.productId',
      select: 'name description price imageUrl businessVolume isActive',
    })
    .lean();

  if (!cart) {
    return { items: [], totalItems: 0, totalAmount: 0 };
  }

  const items = (cart.items ?? [])
    .filter((item) => item.productId && item.productId.isActive !== false)
    .map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      lineTotal: Number(item.productId.price ?? 0) * Number(item.quantity ?? 1),
    }));

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return { items, totalItems, totalAmount };
}

export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req);
    const data = await populateAndFormatCart(cart._id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, error: 'Valid productId is required' });
    }

    const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1);
    const product = await Product.findById(productId).select('_id isActive').lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const cart = await getOrCreateCart(req);
    const existing = cart.items.find((item) => String(item.productId) === String(productId));
    if (existing) {
      existing.quantity += parsedQuantity;
    } else {
      cart.items.push({ productId, quantity: parsedQuantity });
    }
    await cart.save();

    const data = await populateAndFormatCart(cart._id);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function removeFromCart(req, res, next) {
  try {
    const { productId } = req.params;
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, error: 'Valid productId is required' });
    }

    const cart = await getOrCreateCart(req);
    cart.items = cart.items.filter((item) => String(item.productId) !== String(productId));
    await cart.save();

    const data = await populateAndFormatCart(cart._id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req);
    cart.items = [];
    await cart.save();

    const data = await populateAndFormatCart(cart._id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
