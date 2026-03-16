import User from '../models/User.js';
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
