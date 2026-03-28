import mongoose from 'mongoose';
import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import Wallet from '../models/Wallet.js';
import Kyc from '../models/Kyc.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { getBinaryTree as getBinaryTreeData, getReferralTree as getReferralTreeData } from '../services/treeService.js';

/**
 * GET /api/user/team
 * Returns users where sponsorId = logged-in user's id.
 * Requires auth.
 */
export async function getMyTeam(req, res, next) {
  try {
    const userId = req.userId;
    const users = await User.find({ sponsorId: userId })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/profile
 * Returns logged-in user's profile details.
 */
export async function getMyProfile(req, res, next) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId)
      .select(
        'name email mobile role sponsorId parentId position isActive kycStatus isApproved activationDate renewalDate walletBalance rank level sponsoredUsersCount levelReward joiningBonusAmount createdAt'
      )
      .populate('sponsorId', 'name email mobile')
      .populate('parentId', 'name email mobile')
      .lean();

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/binary-tree
 * Returns binary tree structure rooted at the logged-in user (left/right placement).
 * Query: maxDepth (optional, default 6).
 * Requires auth.
 */
export async function getBinaryTree(req, res, next) {
  try {
    const userId = req.userId;
    const maxDepth = Math.min(Math.max(parseInt(req.query.maxDepth, 10) || 6, 1), 10);
    const tree = await getBinaryTreeData(userId, maxDepth);
    res.json({
      success: true,
      data: { tree },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/referral-tree
 * Returns referral tree: only users created with this user's referral ID (sponsorId chain).
 * Root = logged-in user; children = direct referrals; chaining by sponsorId.
 * Query: maxDepth (optional, default 6).
 * Requires auth.
 */
export async function getReferralTree(req, res, next) {
  try {
    const userId = req.userId;
    const maxDepth = Math.min(Math.max(parseInt(req.query.maxDepth, 10) || 6, 1), 10);
    const tree = await getReferralTreeData(userId, maxDepth);
    res.json({
      success: true,
      data: { tree },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/wallet
 * Returns logged-in user's wallet balance.
 */
export async function getMyWallet(req, res, next) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId)
      .select('walletBalance rank')
      .lean();
    res.json({
      success: true,
      data: {
        balance: user?.walletBalance ?? 0,
        rank: user?.rank ?? 'Beginner',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/transactions
 * Returns logged-in user's ledger entries.
 */
export async function getMyTransactions(req, res, next) {
  try {
    const userId = req.userId;
    const transactions = await Ledger.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/withdrawal-info
 * Returns available balance, bank details and recent requests.
 */
export async function getMyWithdrawalInfo(req, res, next) {
  try {
    const userId = req.userId;

    const [user, kyc, recentRequests] = await Promise.all([
      User.findById(userId).select('walletBalance kycStatus').lean(),
      Kyc.findOne({ userId }).select('status bankAccountNumber ifscCode bankName branchName').lean(),
      WithdrawalRequest.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    res.json({
      success: true,
      data: {
        availableBalance: Number(user?.walletBalance ?? 0),
        kycStatus: user?.kycStatus ?? 'none',
        bankDetails: {
          bankAccountNumber: kyc?.bankAccountNumber ?? '',
          ifscCode: kyc?.ifscCode ?? '',
          bankName: kyc?.bankName ?? '',
          branchName: kyc?.branchName ?? '',
          status: kyc?.status ?? 'pending',
        },
        requests: recentRequests,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/user/withdrawal-request
 * Create a withdrawal request and reserve amount from wallet.
 */
export async function createWithdrawalRequest(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const rawAmount = Number(req.body?.amount);
    const amount = Number.isFinite(rawAmount) ? Number(rawAmount.toFixed(2)) : NaN;

    if (!Number.isFinite(amount) || amount <= 0) {
      const err = new Error('Valid withdrawal amount is required');
      err.statusCode = 400;
      throw err;
    }

    const [user, kyc] = await Promise.all([
      User.findById(userId).session(session),
      Kyc.findOne({ userId }).session(session),
    ]);

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.kycStatus !== 'approved' || kyc?.status !== 'approved') {
      const err = new Error('KYC must be approved before requesting withdrawal');
      err.statusCode = 400;
      throw err;
    }

    if (!kyc.bankAccountNumber || !kyc.ifscCode || !kyc.bankName || !kyc.branchName) {
      const err = new Error('Bank details are missing in KYC');
      err.statusCode = 400;
      throw err;
    }

    const available = Number(user.walletBalance ?? 0);
    if (amount > available) {
      const err = new Error('Withdrawal amount cannot exceed available balance');
      err.statusCode = 400;
      throw err;
    }

    const [createdRequest] = await WithdrawalRequest.create(
      [
        {
          userId,
          amount,
          status: 'pending',
          bankAccountNumber: kyc.bankAccountNumber,
          ifscCode: kyc.ifscCode,
          bankName: kyc.bankName,
          branchName: kyc.branchName,
        },
      ],
      { session }
    );

    const [createdLedger] = await Ledger.create(
      [
        {
          userId,
          type: 'withdrawal',
          amount: -amount,
          referenceId: createdRequest._id,
          status: 'pending',
        },
      ],
      { session }
    );

    user.walletBalance = Number((available - amount).toFixed(2));
    await user.save({ session });

    const wallet = await Wallet.findOne({ userId }).session(session);
    if (wallet) {
      wallet.balance = Number((Number(wallet.balance ?? 0) - amount).toFixed(2));
      await wallet.save({ session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        request: createdRequest,
        ledger: createdLedger,
        availableBalance: user.walletBalance,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
}
