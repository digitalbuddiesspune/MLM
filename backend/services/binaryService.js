import mongoose from 'mongoose';
import User from '../models/User.js';
import BinaryStats from '../models/BinaryStats.js';
import { addIncome } from './walletService.js';

const FIXED_MATCHING_AMOUNT = 100;

const USER_PARENT_PROJECTION = 'parentId position';

/**
 * Builds the list of uplines for a user (direct parent to root), each with the side this user is on.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {import('mongoose').ClientSession} session
 * @returns {Promise<Array<{ uplineId: import('mongoose').Types.ObjectId, side: 'left' | 'right' }>>}
 */
async function getUplineChain(userId, session) {
  const chain = [];
  let currentId = userId;

  while (currentId) {
    const user = await User.findById(currentId)
      .select(USER_PARENT_PROJECTION)
      .session(session)
      .lean();

    if (!user || !user.parentId) break;

    chain.push({ uplineId: user.parentId, side: user.position });
    currentId = user.parentId;
  }

  return chain;
}

/**
 * Processes binary income: adds business volume up the tree, matches pairs, pays commission, carries forward remainder.
 * All updates (BinaryStats + wallet/ledger) run in one MongoDB transaction.
 * @param {import('mongoose').Types.ObjectId} userId - User who generated the business volume
 * @param {number} businessVolume
 * @returns {Promise<{ processedUplines: number }>}
 */
export async function processBinaryIncome(userId, businessVolume) {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    const err = new Error('Valid userId is required');
    err.statusCode = 400;
    throw err;
  }

  if (typeof businessVolume !== 'number' || businessVolume <= 0) {
    const err = new Error('Business volume must be a positive number');
    err.statusCode = 400;
    throw err;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const uplineChain = await getUplineChain(userId, session);

    for (const { uplineId, side } of uplineChain) {
      let stats = await BinaryStats.findOne({ userId: uplineId }).session(session);

      if (!stats) {
        [stats] = await BinaryStats.create(
          [
            {
              userId: uplineId,
              leftBV: 0,
              rightBV: 0,
              leftCarry: 0,
              rightCarry: 0,
              totalMatchedPairs: 0,
            },
          ],
          { session }
        );
      }

      if (side === 'left') {
        stats.leftBV += businessVolume;
        stats.leftCarry += businessVolume;
      } else {
        stats.rightBV += businessVolume;
        stats.rightCarry += businessVolume;
      }

      const pairs = Math.min(stats.leftCarry, stats.rightCarry);
      const commission = pairs * FIXED_MATCHING_AMOUNT;

      stats.leftCarry -= pairs;
      stats.rightCarry -= pairs;
      stats.totalMatchedPairs += pairs;

      await stats.save({ session });

      if (commission > 0) {
        await addIncome(uplineId, commission, 'binary', userId, session);
      }
    }

    await session.commitTransaction();

    return { processedUplines: uplineChain.length };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export { FIXED_MATCHING_AMOUNT };
