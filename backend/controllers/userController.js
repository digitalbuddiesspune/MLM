import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Ledger from '../models/Ledger.js';
import Wallet from '../models/Wallet.js';
import Kyc from '../models/Kyc.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import {
  getBinaryTree as getBinaryTreeData,
  shapeCanonicalBinaryPayload,
  getReferralTree as getReferralTreeData,
} from '../services/treeService.js';
import {
  getBinaryDashboardSnapshot,
  getBinaryGenealogyPath,
  isBinaryDescendantOrSelf,
} from '../services/treeQueryService.js';
import { ensureReferralNumber } from '../services/referralNumberService.js';

const PASSWORD_SALT_ROUNDS = 10;

/**
 * GET /api/user/team
 * Returns users where sponsorId = logged-in user's id.
 * Requires auth.
 */
export async function getMyTeam(req, res, next) {
  try {
    const userId = req.userId;
    const rawLimit = req.query.limit;

    if (rawLimit === undefined || rawLimit === '') {
      const users = await User.find({ sponsorId: userId })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: { users },
      });
      return;
    }

    const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 15));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const filter = { sponsorId: userId };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
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
    await ensureReferralNumber(userId);

    const user = await User.findById(userId)
      .select(
        'name email mobile role sponsorId parentId directSponsor leftChild rightChild placementSide placementIndex placementSequence pairMatched activePlacement binaryStatus isActive kycStatus isApproved activationDate renewalDate walletBalance rank level sponsoredUsersCount levelReward joiningBonusAmount referralNumber binaryLeftCount binaryRightCount pairCount binaryIncome createdAt'
      )
      .populate('sponsorId', 'name email mobile referralNumber')
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
 * PATCH /api/user/password
 * Body: { currentPassword, newPassword } — authenticated user updates their own password (admin or member).
 */
export async function changeMyPassword(req, res, next) {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body ?? {};

    if (currentPassword == null || typeof currentPassword !== 'string' || currentPassword.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Current password is required',
      });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters',
      });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from the current password',
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await user.save();

    res.json({ success: true, data: { updated: true } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/binary-tree
 * Query: maxDepth (1–50, or all/full), rootId (subtree root within your team), format=canonical|mlm
 * Requires auth.
 */
export async function getBinaryTree(req, res, next) {
  try {
    const userId = req.userId;
    const raw = req.query.maxDepth;
    let maxDepth = null;

    if (raw !== undefined && raw !== '') {
      const s = String(raw).trim().toLowerCase();
      if (s === 'all' || s === 'full') {
        maxDepth = 50;
      } else if (Number(raw) !== 0) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && n >= 1) {
          maxDepth = Math.min(Math.max(n, 1), 50);
        }
      }
    }

    let rootOverrideId;
    const rootRaw = req.query.rootId ?? req.query.subtreeRoot;
    if (rootRaw != null && String(rootRaw).trim() !== '') {
      const rid = String(rootRaw).trim();
      if (!mongoose.isValidObjectId(rid)) {
        return res.status(400).json({ success: false, error: 'Invalid rootId' });
      }
      const allowed = await isBinaryDescendantOrSelf(userId, rid);
      if (!allowed) {
        return res.status(403).json({ success: false, error: 'Subtree root is outside your binary team' });
      }
      rootOverrideId = rid;
    }

    const treeInternal = await getBinaryTreeData(userId, maxDepth, { rootOverrideId });
    const fmt = String(req.query.format ?? '').toLowerCase();
    const tree =
      fmt === 'canonical' || fmt === 'mlm' ? shapeCanonicalBinaryPayload(treeInternal) : treeInternal;

    res.json({
      success: true,
      data: { tree },
    });
  } catch (error) {
    next(error);
  }
}

/** GET /api/user/binary-dashboard */
export async function getBinaryDashboard(req, res, next) {
  try {
    const overview = await getBinaryDashboardSnapshot(req.userId);
    if (!overview) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}

/** GET /api/user/binary-genealogy/:memberId — breadcrumb anchor defaults to viewer. */
export async function getBinaryGenealogyUser(req, res, next) {
  try {
    const viewerId = req.userId;
    const { memberId } = req.params;
    if (!mongoose.isValidObjectId(memberId)) {
      return res.status(400).json({ success: false, error: 'Invalid member id' });
    }

    let anchorRoot = viewerId;
    const ar = req.query.anchorRoot ?? req.query.subtreeRoot;
    if (ar != null && String(ar).trim() !== '') {
      const anchor = String(ar).trim();
      if (!mongoose.isValidObjectId(anchor)) {
        return res.status(400).json({ success: false, error: 'Invalid anchorRoot' });
      }
      const anchorOk = await isBinaryDescendantOrSelf(viewerId, anchor);
      if (!anchorOk) {
        return res.status(403).json({ success: false, error: 'Invalid anchor subtree' });
      }
      anchorRoot = anchor;
    }

    const underAnchor = await isBinaryDescendantOrSelf(anchorRoot, memberId);
    if (!underAnchor) {
      return res.status(403).json({ success: false, error: 'Member is outside the selected subtree' });
    }

    const data = await getBinaryGenealogyPath(anchorRoot, memberId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /api/user/binary-find?referralNumber= */
export async function getBinaryFind(req, res, next) {
  try {
    const raw = req.query.referralNumber ?? req.query.code;
    const num = Number(raw);
    if (!Number.isSafeInteger(num) || num < 100_001) {
      return res.status(400).json({ success: false, error: 'Valid referralNumber is required' });
    }

    const hit = await User.findOne({ referralNumber: num }).select('_id name referralNumber isActive').lean();
    if (!hit) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const allowed = await isBinaryDescendantOrSelf(req.userId, hit._id);
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Member is outside your placement tree' });
    }

    res.json({
      success: true,
      data: {
        id: String(hit._id),
        name: hit.name,
        referralNumber: hit.referralNumber,
        status: hit.isActive ? 'active' : 'inactive',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/user/binary-tree/swap-children
 *
 * Removed in the unidirectional binary-flow refactor. Side overrides are admin-only via the new
 * /api/tree/manual-place and drag-drop endpoints.
 */
export async function swapBinaryChildren(_req, res) {
  res.status(410).json({
    success: false,
    error:
      'This endpoint is no longer available. Sides are admin-controlled in the unidirectional binary tree (use /api/tree/manual-place).',
  });
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
    await ensureReferralNumber(userId);

    const user = await User.findById(userId)
      .select('walletBalance rank referralNumber')
      .lean();

    res.json({
      success: true,
      data: {
        balance: user?.walletBalance ?? 0,
        rank: user?.rank ?? 'Beginner',
        referralNumber: user?.referralNumber ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Turns various BSON/JSON shapes into a 24-char hex id, or null.
 */
function ledgerCreditRefHex(raw) {
  if (raw == null || raw === '') return null;
  let v = raw;
  if (typeof v === 'object' && v !== null && typeof v.$oid === 'string') {
    v = v.$oid;
  }
  try {
    return new mongoose.Types.ObjectId(v).toString();
  } catch {
    return null;
  }
}

/** Reference on the document or duplicate path in metadata (legacy / safety). */
function effectiveCreditRefHex(t) {
  return (
    ledgerCreditRefHex(t.referenceId) ??
    ledgerCreditRefHex(t.metadata?.creditSourceUserId) ??
    ledgerCreditRefHex(t.metadata?.creditSourceId)
  );
}

/**
 * Resolves ledger referenceId to the member whose activity/order triggered the credit (batch).
 */
async function attachSourceMembersToLedgers(transactions) {
  const refIdStrs = [...new Set(transactions.map((t) => effectiveCreditRefHex(t)).filter(Boolean))];

  if (refIdStrs.length === 0) {
    return transactions.map((t) => {
      if (t.type === 'withdrawal') {
        return { ...t, sourceMember: null };
      }
      const noRef = !effectiveCreditRefHex(t);
      if (noRef && Number(t.amount) > 0) {
        return {
          ...t,
          sourceMember: {
            name: 'Not linked (older payout)',
            linkKind: 'no_ref_stored',
            detail: 'This entry has no stored member id. New income will show the linked member.',
          },
        };
      }
      return { ...t, sourceMember: null };
    });
  }

  const refOids = refIdStrs.map((id) => new mongoose.Types.ObjectId(id));

  /** @type {Record<string, { name: string, email?: string, mobile?: string, referralNumber?: number }>} */
  const usersById = {};

  const directUsers = await User.find({ _id: { $in: refOids } })
    .select('name email mobile referralNumber')
    .lean();

  for (const u of directUsers) {
    usersById[String(u._id)] = {
      name: u.name ?? '—',
      email: u.email,
      mobile: u.mobile,
      referralNumber: u.referralNumber ?? undefined,
    };
  }

  const unresolvedRefStrs = refIdStrs.filter((id) => !usersById[id]);
  const unresolvedOids = unresolvedRefStrs.map((id) => new mongoose.Types.ObjectId(id));

  /** @type {Record<string, string>} */
  const orderIdToBuyerUserId = {};

  if (unresolvedOids.length > 0) {
    const orders = await Order.find({ _id: { $in: unresolvedOids } }).select('userId').lean();
    const buyerIds = new Set();

    for (const o of orders) {
      if (o.userId) {
        orderIdToBuyerUserId[String(o._id)] = String(o.userId);
        buyerIds.add(String(o.userId));
      }
    }

    const buyerOids = [...buyerIds]
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (buyerOids.length > 0) {
      const buyers = await User.find({ _id: { $in: buyerOids } })
        .select('name email mobile referralNumber')
        .lean();

      for (const u of buyers) {
        usersById[String(u._id)] = {
          name: u.name ?? '—',
          email: u.email,
          mobile: u.mobile,
          referralNumber: u.referralNumber ?? undefined,
        };
      }
    }
  }

  return transactions.map((t) => {
    if (t.type === 'withdrawal') {
      return { ...t, sourceMember: null };
    }

    const rid = effectiveCreditRefHex(t);
    if (!rid) {
      if (Number(t.amount) > 0) {
        return {
          ...t,
          sourceMember: {
            name: 'Not linked (older payout)',
            linkKind: 'no_ref_stored',
            detail: 'This entry has no stored member id. New income will show the linked member.',
          },
        };
      }
      return { ...t, sourceMember: null };
    }

    if (usersById[rid]) {
      return {
        ...t,
        sourceMember: {
          ...usersById[rid],
          linkKind: 'member',
          detail: 'Activity credited from this member in your network',
        },
      };
    }

    const buyerUserId = orderIdToBuyerUserId[rid];

    if (buyerUserId && usersById[buyerUserId]) {
      return {
        ...t,
        sourceMember: {
          ...usersById[buyerUserId],
          linkKind: 'order_buyer',
          detail: 'Linked to a product order placed by this member',
        },
      };
    }

    return {
      ...t,
      sourceMember: {
        name: 'Member or order not found',
        linkKind: 'unresolved_ref',
        refIdTail: rid.slice(-6),
        detail: 'The stored link no longer matches a user or order in the system.',
      },
    };
  });
}

/**
 * GET /api/user/transactions
 * Returns logged-in user's ledger entries (with sourceMember when reference resolves).
 */
export async function getMyTransactions(req, res, next) {
  try {
    const userId = req.userId;
    const transactions = await Ledger.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await attachSourceMembersToLedgers(transactions);

    res.json({
      success: true,
      data: { transactions: enriched },
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
