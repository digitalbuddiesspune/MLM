import mongoose from 'mongoose';
import Wallet from '../models/Wallet.js';
import Ledger from '../models/Ledger.js';

const LEDGER_TYPES = ['binary', 'generation', 'royalty', 'withdrawal', 'joining_bonus'];

/**
 * Adds income to a user's wallet and records a ledger entry atomically.
 * Creates a wallet for the user if one does not exist.
 * When session is provided, runs inside caller's transaction (no commit/abort).
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {number} amount
 * @param {'binary' | 'generation' | 'royalty' | 'withdrawal' | 'joining_bonus'} type
 * @param {import('mongoose').Types.ObjectId} [referenceId]
 * @param {import('mongoose').ClientSession} [session] - Optional; when provided, caller owns transaction
 * @returns {Promise<{ wallet: Object, ledger: Object }>}
 */
export async function addIncome(userId, amount, type, referenceId = null, session = null) {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    const err = new Error('Valid userId is required');
    err.statusCode = 400;
    throw err;
  }

  if (!LEDGER_TYPES.includes(type)) {
    const err = new Error(`Invalid ledger type. Must be one of: ${LEDGER_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (typeof amount !== 'number' || amount <= 0) {
    const err = new Error('Amount must be a positive number');
    err.statusCode = 400;
    throw err;
  }

  const ownSession = !session;
  const activeSession = session ?? (await mongoose.startSession());
  if (ownSession) activeSession.startTransaction();

  try {
    let wallet = await Wallet.findOne({ userId }).session(activeSession);

    if (!wallet) {
      [wallet] = await Wallet.create([{ userId, balance: 0 }], { session: activeSession });
    }

    const [ledgerEntry] = await Ledger.create(
      [
        {
          userId,
          type,
          amount,
          referenceId,
          status: 'completed',
        },
      ],
      { session: activeSession }
    );

    wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, session: activeSession }
    );

    if (ownSession) {
      await activeSession.commitTransaction();
    }

    return {
      wallet: wallet.toObject(),
      ledger: ledgerEntry.toObject(),
    };
  } catch (error) {
    if (ownSession) {
      await activeSession.abortTransaction();
    }
    throw error;
  } finally {
    if (ownSession) {
      await activeSession.endSession();
    }
  }
}
