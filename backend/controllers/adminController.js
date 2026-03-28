import mongoose from 'mongoose';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Ledger from '../models/Ledger.js';
import PayoutRun from '../models/PayoutRun.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { syncUserLevel } from '../services/levelService.js';

/**
 * GET /api/admin/stats
 */
export async function getStats(req, res, next) {
  try {
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      walletsResult,
      unprocessedLedger,
      payoutRunsCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      Ledger.aggregate([
        { $match: { payoutRunId: null, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PayoutRun.countDocuments(),
    ]);

    const totalWalletBalance = walletsResult[0]?.total ?? 0;
    const pendingPayoutAmount = unprocessedLedger[0]?.total ?? 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        totalWalletBalance,
        pendingPayoutAmount,
        payoutRunsCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users?page=1&limit=10&search=&role=&isActive=&sponsorId=
 */
export async function getUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = (req.query.search || '').trim();
    const role = req.query.role;
    const isActive = req.query.isActive;
    const sponsorId = req.query.sponsorId;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined && isActive !== '') filter.isActive = isActive === 'true';
    if (sponsorId && mongoose.isValidObjectId(sponsorId)) filter.sponsorId = sponsorId;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
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

/**
 * GET /api/admin/user-wallets?page=1&limit=10&search=&role=
 * List users with wallet balance for admin wallet monitoring.
 */
export async function getUserWallets(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }
    if (role === 'user' || role === 'admin') {
      filter.role = role;
    }

    const [users, total, totals] = await Promise.all([
      User.find(filter)
        .select('name email mobile role isActive kycStatus walletBalance createdAt')
        .sort({ walletBalance: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      User.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalWalletBalance: { $sum: '$walletBalance' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        users,
        summary: {
          totalWalletBalance: totals[0]?.totalWalletBalance ?? 0,
        },
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

/**
 * GET /api/admin/withdrawal-requests?page=1&limit=10&status=&search=
 * List all user withdrawal requests for payout processing.
 */
export async function getWithdrawalRequests(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const status = (req.query.status || '').trim();
    const search = (req.query.search || '').trim();

    const filter = {};
    if (status && ['pending', 'approved', 'rejected', 'paid'].includes(status)) {
      filter.status = status;
    }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'user.mobile': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    const [countResult, requests] = await Promise.all([
      WithdrawalRequest.aggregate([...pipeline, { $count: 'total' }]),
      WithdrawalRequest.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            amount: 1,
            status: 1,
            bankAccountNumber: 1,
            ifscCode: 1,
            bankName: 1,
            branchName: 1,
            remarks: 1,
            createdAt: 1,
            reviewedAt: 1,
            userId: {
              _id: '$user._id',
              name: '$user.name',
              email: '$user.email',
              mobile: '$user.mobile',
            },
          },
        },
      ]),
    ]);

    const total = countResult[0]?.total ?? 0;

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/withdrawal-requests/:id
 * Update withdrawal request status (approved/rejected/paid).
 */
export async function reviewWithdrawalRequest(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const nextStatus = String(req.body?.status || '').trim().toLowerCase();
    const remarks = String(req.body?.remarks || '').trim();

    if (!mongoose.isValidObjectId(id)) {
      const err = new Error('Invalid withdrawal request id');
      err.statusCode = 400;
      throw err;
    }
    if (!['approved', 'rejected', 'paid'].includes(nextStatus)) {
      const err = new Error('Status must be one of: approved, rejected, paid');
      err.statusCode = 400;
      throw err;
    }

    const request = await WithdrawalRequest.findById(id).session(session);
    if (!request) {
      const err = new Error('Withdrawal request not found');
      err.statusCode = 404;
      throw err;
    }

    const currentStatus = request.status;
    if (currentStatus === 'rejected' || currentStatus === 'paid') {
      const err = new Error(`Cannot update a ${currentStatus} request`);
      err.statusCode = 400;
      throw err;
    }

    if (nextStatus === 'approved') {
      if (currentStatus !== 'pending') {
        const err = new Error('Only pending requests can be approved');
        err.statusCode = 400;
        throw err;
      }
      request.status = 'approved';
      request.reviewedBy = req.userId;
      request.reviewedAt = new Date();
      if (remarks) request.remarks = remarks;
      await request.save({ session });
    } else if (nextStatus === 'paid') {
      if (currentStatus !== 'approved') {
        const err = new Error('Only approved requests can be marked paid');
        err.statusCode = 400;
        throw err;
      }
      request.status = 'paid';
      request.reviewedBy = req.userId;
      request.reviewedAt = new Date();
      if (remarks) request.remarks = remarks;
      await request.save({ session });

      await Ledger.updateMany(
        {
          userId: request.userId,
          type: 'withdrawal',
          referenceId: request._id,
          status: 'pending',
        },
        { $set: { status: 'completed' } },
        { session }
      );
    } else if (nextStatus === 'rejected') {
      if (!['pending', 'approved'].includes(currentStatus)) {
        const err = new Error('Only pending/approved requests can be rejected');
        err.statusCode = 400;
        throw err;
      }

      request.status = 'rejected';
      request.reviewedBy = req.userId;
      request.reviewedAt = new Date();
      if (remarks) request.remarks = remarks;
      await request.save({ session });

      await Ledger.updateMany(
        {
          userId: request.userId,
          type: 'withdrawal',
          referenceId: request._id,
          status: 'pending',
        },
        { $set: { status: 'failed' } },
        { session }
      );

      await User.findByIdAndUpdate(
        request.userId,
        { $inc: { walletBalance: request.amount } },
        { session }
      );

      const wallet = await Wallet.findOne({ userId: request.userId }).session(session);
      if (wallet) {
        wallet.balance = Number((Number(wallet.balance ?? 0) + Number(request.amount ?? 0)).toFixed(2));
        await wallet.save({ session });
      } else {
        await Wallet.create(
          [
            {
              userId: request.userId,
              balance: Number(request.amount ?? 0),
            },
          ],
          { session }
        );
      }
    }

    await session.commitTransaction();

    const updated = await WithdrawalRequest.findById(id)
      .populate('userId', 'name email mobile')
      .lean();

    res.json({ success: true, data: { request: updated } });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
}

/**
 * PATCH /api/admin/users/:id
 * Update user details (name, email, mobile, role, isActive). Admin only.
 */
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, mobile, role, isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const user = await User.findById(id).select('name email mobile role isActive').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof mobile === 'string' && mobile.trim()) updates.mobile = mobile.trim();
    if (typeof email === 'string' && email.trim()) {
      const normalized = email.trim().toLowerCase();
      if (normalized !== user.email) {
        const existing = await User.findOne({ email: normalized });
        if (existing) {
          return res.status(400).json({ success: false, error: 'Email already in use' });
        }
        updates.email = normalized;
      }
    }
    if (role === 'user' || role === 'admin') updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    res.json({ success: true, data: { user: updated } });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Delete a user. Clears parent's leftChildId/rightChildId so the binary tree slot is freed.
 */
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const user = await User.findById(id).select('parentId position sponsorId').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.parentId != null && user.position) {
      const parentUpdate = user.position === 'left'
        ? { $set: { leftChildId: null } }
        : { $set: { rightChildId: null } };
      await User.findByIdAndUpdate(user.parentId, parentUpdate);
    }

    await User.findByIdAndDelete(id);
    if (user.sponsorId) {
      await syncUserLevel(user.sponsorId);
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}
