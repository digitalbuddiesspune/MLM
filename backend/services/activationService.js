import mongoose from 'mongoose';
import User from '../models/User.js';
import { processActivationCommission } from './commissionEngine.js';

const ACTIVATION_AMOUNT_INR = 1500;

/**
 * Activates a user after successful payment of ₹1500.
 * Sets isActive, activationDate, renewalDate and triggers the commission engine.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {{ amount: number, paymentReference?: string }} payment
 * @returns {Promise<Object>} Updated user (no password)
 */
export async function activateUser(userId, payment = {}) {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    const err = new Error('Valid userId is required');
    err.statusCode = 400;
    throw err;
  }

  const amount = payment?.amount ?? 0;
  if (amount !== ACTIVATION_AMOUNT_INR) {
    const err = new Error(`Activation requires payment of ₹${ACTIVATION_AMOUNT_INR}`);
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId).select('_id isActive').lean();
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.isActive) {
    const err = new Error('User is already active');
    err.statusCode = 409;
    throw err;
  }

  const now = new Date();
  const renewalDate = new Date(now);
  renewalDate.setDate(renewalDate.getDate() + 30);

  await User.findByIdAndUpdate(userId, {
    $set: {
      isActive: true,
      activationDate: now,
      renewalDate,
    },
  });

  await processActivationCommission(userId);

  const updated = await User.findById(userId).select('-password').lean();
  return updated;
}

export { ACTIVATION_AMOUNT_INR };
