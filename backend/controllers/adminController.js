import mongoose from 'mongoose';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Ledger from '../models/Ledger.js';
import PayoutRun from '../models/PayoutRun.js';

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
 * PATCH /api/admin/users/:id
 * Update user details (name, email, role, isActive, panNumber, bankAccountNumber, upiId). Admin only.
 */
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, panNumber, bankAccountNumber, upiId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const user = await User.findById(id).select('name email role isActive panNumber bankAccountNumber upiId').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
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
    if (panNumber !== undefined) updates.panNumber = typeof panNumber === 'string' ? panNumber.trim() : '';
    if (bankAccountNumber !== undefined) updates.bankAccountNumber = typeof bankAccountNumber === 'string' ? bankAccountNumber.trim() : '';
    if (upiId !== undefined) updates.upiId = typeof upiId === 'string' ? upiId.trim() : '';

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

    const user = await User.findById(id).select('parentId position').lean();
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
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}
