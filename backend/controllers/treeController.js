import mongoose from 'mongoose';
import User from '../models/User.js';
import {
  findOpenSlotsInSubtree,
  placeUserUnderSponsor,
  setPlacementSide,
} from '../services/placementService.js';
import { isBinaryDescendantOrSelf } from '../services/treeQueryService.js';
import { moveNode } from '../services/dragDropService.js';
import {
  buildSponsorTree,
  flatDownline,
  getPairsSummary,
  getBinaryIncomeSummary,
} from '../services/treeQueryService.js';

function asObjectId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error(`Invalid ${label}`);
    err.statusCode = 400;
    throw err;
  }
  return new mongoose.Types.ObjectId(id);
}

/**
 * GET /api/tree/unplaced-users
 * Admin: users with a sponsor but not yet placed in the binary tree.
 */
export async function getUnplacedUsers(req, res, next) {
  try {
    const actor = await User.findById(req.userId).select('_id role').lean();
    if (!actor) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (actor.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const users = await User.find({
      sponsorId: { $ne: null },
      parentId: null,
      role: { $ne: 'admin' },
    })
      .select('_id name email mobile referralNumber sponsorId createdAt')
      .populate('sponsorId', 'name referralNumber')
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          ...u,
          sponsorId: u.sponsorId?._id ?? u.sponsorId,
          sponsor: u.sponsorId && typeof u.sponsorId === 'object'
            ? {
                _id: u.sponsorId._id,
                name: u.sponsorId.name,
                referralNumber: u.sponsorId.referralNumber,
              }
            : null,
        })),
        total: users.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tree/open-slots?sponsorId=
 * Lists open LEFT/RIGHT legs in a sponsor's binary subtree (defaults to logged-in user).
 */
export async function getOpenSlots(req, res, next) {
  try {
    const actor = await User.findById(req.userId).select('_id role').lean();
    if (!actor) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const rawSponsorId = req.query.sponsorId ?? req.userId;
    asObjectId(rawSponsorId, 'sponsorId');

    const isAdmin = actor.role === 'admin';
    if (!isAdmin && String(rawSponsorId) !== String(actor._id)) {
      return res.status(403).json({ success: false, error: 'You can only view open slots in your own binary subtree' });
    }

    const slots = await findOpenSlotsInSubtree(rawSponsorId);
    res.json({ success: true, data: { slots, total: slots.length } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tree/place
 * Body: { userId, sponsorId, parentId?, side?: 'left'|'right' }
 * Sponsors must pass parentId + side to choose an open end-node leg.
 * Admins may omit parentId to auto-place or set parentId + side for manual placement.
 */
export async function postPlace(req, res, next) {
  try {
    const { userId, sponsorId, parentId, side } = req.body ?? {};
    asObjectId(userId, 'userId');
    asObjectId(sponsorId, 'sponsorId');
    if (parentId) asObjectId(parentId, 'parentId');

    const [actor, candidate] = await Promise.all([
      User.findById(req.userId).select('_id role').lean(),
      User.findById(userId).select('_id sponsorId parentId').lean(),
    ]);
    if (!actor) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (candidate.parentId) {
      return res.status(422).json({ success: false, error: 'User is already placed in the binary tree' });
    }

    const isAdmin = actor.role === 'admin';
    if (!isAdmin) {
      const actorId = String(actor._id);
      if (String(sponsorId) !== actorId) {
        return res.status(403).json({ success: false, error: 'You can only place users under your own sponsor node' });
      }
      if (!candidate.sponsorId || String(candidate.sponsorId) !== actorId) {
        return res.status(403).json({ success: false, error: 'You can only place users registered with your referral code' });
      }
      const inSubtree = await isBinaryDescendantOrSelf(sponsorId, parentId);
      if (!inSubtree) {
        return res.status(403).json({ success: false, error: 'Selected slot is outside your binary subtree' });
      }
    }

    if (!parentId || (side !== 'left' && side !== 'right')) {
      return res.status(400).json({
        success: false,
        error: 'Choose an open slot: parentId and side (left or right) are required',
      });
    }

    const result = await placeUserUnderSponsor({
      userId,
      sponsorId,
      placementParentId: parentId ?? null,
      preferredSide: side ?? null,
      manualPlacement: Boolean(parentId && side) || Boolean(side),
      actorUserId: req.userId,
      reason: req.body?.reason || (isAdmin ? 'admin manual placement' : 'sponsor manual placement'),
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tree/manual-place
 * Body: { userId, side: 'left'|'right' }
 * Admin overrides the placement side WITHOUT changing sponsor.
 */
export async function postManualPlace(req, res, next) {
  try {
    const { userId, side } = req.body ?? {};
    asObjectId(userId, 'userId');
    if (side !== 'left' && side !== 'right') {
      return res.status(400).json({ success: false, error: 'side must be "left" or "right"' });
    }
    const result = await setPlacementSide({
      userId,
      newSide: side,
      actorUserId: req.userId,
      reason: req.body?.reason || 'admin manual side override',
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tree/drag-drop
 * Body: { userId, newSponsorId, newSide?: 'left'|'right' }
 * Admin re-parents a node. Validates against cycles and self-parenting.
 */
export async function postDragDrop(req, res, next) {
  try {
    const { userId, newSponsorId, newSide } = req.body ?? {};
    asObjectId(userId, 'userId');
    asObjectId(newSponsorId, 'newSponsorId');

    const result = await moveNode({
      userId,
      newSponsorId,
      newSide: newSide ?? null,
      actorUserId: req.userId,
      reason: req.body?.reason || 'admin drag-drop',
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tree/:id?maxDepth=
 * Sponsor-centric subtree.
 */
export async function getTree(req, res, next) {
  try {
    const { id } = req.params;
    asObjectId(id, 'id');
    const maxDepth = Math.min(50, Math.max(1, parseInt(req.query.maxDepth, 10) || 6));
    const tree = await buildSponsorTree(id, maxDepth);
    res.json({ success: true, data: { tree } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tree/downline/:id?maxDepth=
 * Flat downline list rooted at :id (defaults to logged-in user when :id is "me").
 */
export async function getDownline(req, res, next) {
  try {
    const raw = req.params.id ?? 'me';
    const id = raw === 'me' ? req.userId : raw;
    asObjectId(id, 'id');
    const maxDepth = Math.min(50, Math.max(1, parseInt(req.query.maxDepth, 10) || 10));
    const list = await flatDownline(id, maxDepth);
    res.json({ success: true, data: { downline: list, total: list.length } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tree/pairs/:id?
 */
export async function getPairs(req, res, next) {
  try {
    const raw = req.params.id ?? 'me';
    const id = raw === 'me' ? req.userId : raw;
    asObjectId(id, 'id');
    const summary = await getPairsSummary(id);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tree/income/:id?
 */
export async function getIncome(req, res, next) {
  try {
    const raw = req.params.id ?? 'me';
    const id = raw === 'me' ? req.userId : raw;
    asObjectId(id, 'id');
    const summary = await getBinaryIncomeSummary(id);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}
