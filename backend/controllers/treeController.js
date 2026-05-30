import mongoose from 'mongoose';
import User from '../models/User.js';
import {
  placeUserUnderSponsor,
  setPlacementSide,
} from '../services/placementService.js';
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
 * POST /api/tree/place
 * Body: { userId, sponsorId, side?: 'left'|'right' }
 * Admin places an existing user under a sponsor. Sets placementSide; default 'left'.
 */
export async function postPlace(req, res, next) {
  try {
    const { userId, sponsorId, side } = req.body ?? {};
    asObjectId(userId, 'userId');
    asObjectId(sponsorId, 'sponsorId');

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
    }

    const result = await placeUserUnderSponsor({
      userId,
      sponsorId,
      preferredSide: side ?? null,
      manualPlacement: Boolean(side),
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
