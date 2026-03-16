import mongoose from 'mongoose';
import User from '../models/User.js';
import { addIncome } from './walletService.js';

const MAX_LEVELS = 10;

/** Level payout as percentage of amount: level 1 = 20%, 2–5 = 10%, 6 = 8%, 7–10 = 2%. */
const PAYOUT_PERCENT_BY_LEVEL = [20, 10, 10, 10, 10, 8, 2, 2, 2, 2];

/**
 * Gets up to 10 sponsor levels above the given user (level 1 = direct sponsor).
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {Promise<Array<{ sponsorId: import('mongoose').Types.ObjectId, level: number, isActive: boolean }>>}
 */
async function getSponsorChain(userId) {
  const chain = [];
  let currentId = userId;

  for (let level = 1; level <= MAX_LEVELS; level++) {
    const user = await User.findById(currentId).select('sponsorId').lean();
    if (!user?.sponsorId) break;

    const sponsor = await User.findById(user.sponsorId).select('isActive').lean();
    if (!sponsor) break;

    chain.push({
      sponsorId: user.sponsorId,
      level,
      isActive: sponsor.isActive === true,
    });

    currentId = user.sponsorId;
  }

  return chain;
}

/**
 * Processes generation income: traverses up 10 sponsor levels and pays each active sponsor
 * according to the level payout structure (only if sponsor.isActive === true).
 * @param {import('mongoose').Types.ObjectId} userId - User who generated the amount (sale/downline activity)
 * @param {number} amount - Base amount for commission calculation
 * @returns {Promise<{ paidLevels: number, totalPaid: number }>}
 */
export async function processGenerationIncome(userId, amount) {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    const err = new Error('Valid userId is required');
    err.statusCode = 400;
    throw err;
  }

  if (typeof amount !== 'number' || amount <= 0) {
    const err = new Error('Amount must be a positive number');
    err.statusCode = 400;
    throw err;
  }

  const chain = await getSponsorChain(userId);

  let totalPaid = 0;
  let paidLevels = 0;

  for (const { sponsorId, level, isActive } of chain) {
    if (!isActive) continue;

    const percent = PAYOUT_PERCENT_BY_LEVEL[level - 1] ?? 0;
    const commission = Math.round((amount * percent) / 100);

    if (commission <= 0) continue;

    await addIncome(sponsorId, commission, 'generation', userId);
    totalPaid += commission;
    paidLevels += 1;
  }

  return { paidLevels, totalPaid };
}

export { PAYOUT_PERCENT_BY_LEVEL, MAX_LEVELS };
