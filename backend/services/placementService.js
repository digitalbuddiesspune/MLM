import mongoose from 'mongoose';
import User from '../models/User.js';
import { addIncome } from './walletService.js';

export const BINARY_AMOUNT_PER_PAIR = 150;
export const DEFAULT_PLACEMENT_SIDE = 'left';

const PLACEMENT_SIDES = ['left', 'right'];
const MAX_PLACEMENT_TRAVERSAL = 1_000_000;
/** Retries race-heavy slot claims inside a transaction when two signups collide. */
const MAX_PLACEMENT_CLAIM_ATTEMPTS = 12;

function ensureValidSide(side) {
  if (side != null && !PLACEMENT_SIDES.includes(side)) {
    const err = new Error(`Invalid placement side: ${side}`);
    err.statusCode = 400;
    throw err;
  }
}

function binaryStatusFor(node) {
  if (node.placementFrozen) return 'frozen';
  if (!node.leftChild) return 'open_left';
  if (!node.rightChild) return 'open_right';
  return 'pair_matched';
}

async function nextPlacementSequence(session) {
  const latest = await User.findOne({ placementSequence: { $gt: 0 } })
    .select('placementSequence')
    .sort({ placementSequence: -1 })
    .session(session)
    .lean();
  return Number(latest?.placementSequence ?? 0) + 1;
}

async function refreshNodeBinaryState(nodeId, session) {
  const node = await User.findById(nodeId).session(session);
  if (!node) return null;

  node.binaryLeftCount = node.leftChild ? 1 : 0;
  node.binaryRightCount = node.rightChild ? 1 : 0;
  const matchedNow = Boolean(node.leftChild && node.rightChild);
  const wasMatched = Boolean(node.pairMatched);

  node.pairMatched = matchedNow;
  node.pairCount = matchedNow ? 1 : 0;
  node.activePlacement = !matchedNow && !node.placementFrozen;
  node.binaryStatus = binaryStatusFor(node);
  await node.save({ session });

  if (matchedNow && !wasMatched) {
    await addIncome(node._id, BINARY_AMOUNT_PER_PAIR, 'binary', node._id, session, {
      pairs: 1,
      perPair: BINARY_AMOUNT_PER_PAIR,
      reason: 'binary pair matched',
    });
    await User.findByIdAndUpdate(
      node._id,
      { $inc: { binaryIncome: BINARY_AMOUNT_PER_PAIR } },
      { session }
    );
    return { deltaPairs: 1, deltaIncome: BINARY_AMOUNT_PER_PAIR };
  }

  return { deltaPairs: 0, deltaIncome: 0 };
}

/**
 * Atomically claim one empty leg under `parentId` inside a MongoDB transaction.
 */
async function atomicClaimBinarySlot(parentId, side, userId, session) {
  const slot = side === 'left' ? 'leftChild' : 'rightChild';
  const updated = await User.findOneAndUpdate(
    {
      _id: parentId,
      [slot]: null,
      placementFrozen: { $ne: true },
    },
    {
      $set: { [slot]: userId },
      $addToSet: { children: userId },
    },
    { session, new: true }
  );

  return Boolean(updated);
}

export async function assertPlacementSafe(userId, placementParentId, session = null) {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(placementParentId)) {
    const err = new Error('Invalid placement ids');
    err.statusCode = 400;
    throw err;
  }

  if (String(userId) === String(placementParentId)) {
    const err = new Error('A user cannot be their own placement parent');
    err.statusCode = 400;
    throw err;
  }

  const seen = new Set();
  let current = String(placementParentId);
  while (current) {
    if (seen.has(current)) {
      const err = new Error('Detected a cycle in the existing binary tree');
      err.statusCode = 400;
      throw err;
    }
    seen.add(current);

    if (current === String(userId)) {
      const err = new Error('Cannot place a user under one of their own descendants');
      err.statusCode = 400;
      throw err;
    }

    const q = User.findById(current).select('parentId').lean();
    const node = session ? await q.session(session) : await q;
    if (!node || !node.parentId) break;
    current = String(node.parentId);
  }
}

/**
 * Queue-based BFS from the sponsor root:
 * iterate level-by-level; at each node try left vacany, then right; otherwise enqueue legs left then right.
 */
export async function findAvailableParent(rootSponsorId, session = null) {
  if (!mongoose.isValidObjectId(rootSponsorId)) {
    const err = new Error('Invalid sponsor id');
    err.statusCode = 400;
    throw err;
  }

  const rootQuery = User.findById(rootSponsorId).select('_id').lean();
  const rootExists = session ? await rootQuery.session(session) : await rootQuery;
  if (!rootExists) {
    const err = new Error('Sponsor not found');
    err.statusCode = 404;
    throw err;
  }

  const queue = [rootSponsorId];
  let scanned = 0;

  while (queue.length > 0 && scanned < MAX_PLACEMENT_TRAVERSAL) {
    scanned += 1;
    const currentId = queue.shift();
    const nodeQuery = User.findById(currentId)
      .select('_id leftChild rightChild placementFrozen')
      .lean();
    const node = session ? await nodeQuery.session(session) : await nodeQuery;
    if (!node || node.placementFrozen) continue;

    if (!node.leftChild) {
      return { parentId: node._id, placementSide: 'left' };
    }
    if (!node.rightChild) {
      return { parentId: node._id, placementSide: 'right' };
    }

    if (node.leftChild) queue.push(node.leftChild);
    if (node.rightChild) queue.push(node.rightChild);
  }

  const err = new Error('No eligible placement found under sponsor subtree');
  err.statusCode = 422;
  throw err;
}

/** @deprecated use findAvailableParent */
export const findNextEligiblePlacement = findAvailableParent;

/** MLM pairing math exposed for reporting / dashboards. */
export function calculateMatchingBonus(matchesCount = 1) {
  const n = Math.max(0, Number(matchesCount) || 0);
  return {
    perPair: BINARY_AMOUNT_PER_PAIR,
    total: n * BINARY_AMOUNT_PER_PAIR,
    pairs: n,
  };
}

export async function placeUserUnderSponsor({
  userId,
  sponsorId,
  preferredSide = null,
  manualPlacement = false,
  session = null,
  actorUserId = null,
  reason = '',
}) {
  ensureValidSide(preferredSide);

  const ownSession = !session;
  const activeSession = session ?? (await mongoose.startSession());
  if (ownSession) activeSession.startTransaction();

  try {
    const user = await User.findById(userId).session(activeSession);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    if (user.parentId) {
      const err = new Error('User is already placed in the binary tree');
      err.statusCode = 422;
      throw err;
    }

    if (manualPlacement && preferredSide) {
      await assertPlacementSafe(userId, sponsorId, activeSession);
      let claimedManual = await atomicClaimBinarySlot(sponsorId, preferredSide, user._id, activeSession);
      if (!claimedManual) {
        const err = new Error(`${preferredSide.toUpperCase()} leg is already occupied`);
        err.statusCode = 409;
        throw err;
      }

      const sequence = await nextPlacementSequence(activeSession);
      user.sponsorId = sponsorId;
      user.directSponsor = sponsorId;
      user.parentId = sponsorId;
      user.placementSide = preferredSide;
      user.placementIndex = sequence;
      user.placementSequence = sequence;
      user.activePlacement = true;
      user.binaryStatus = 'open_left';
      user.manualPlacement = true;
      user.placementHistory.push({
        fromSponsorId: null,
        toSponsorId: sponsorId,
        fromSide: null,
        toSide: preferredSide,
        fromIndex: null,
        toIndex: sequence,
        movedBy: actorUserId,
        movedAt: new Date(),
        reason: reason || 'manual placement',
      });
      await user.save({ session: activeSession });

      const pairCredit = await refreshNodeBinaryState(sponsorId, activeSession);

      if (ownSession) await activeSession.commitTransaction();

      return {
        placement: {
          userId: String(user._id),
          sponsorId: String(sponsorId),
          parentId: String(sponsorId),
          placementSide: preferredSide,
          placementSequence: sequence,
        },
        pairCredit,
      };
    }

    let placementSide;
    let parent;
    let sequence;
    let claimed = false;
    let pairCredit = { deltaPairs: 0, deltaIncome: 0 };

    for (let attempt = 0; attempt < MAX_PLACEMENT_CLAIM_ATTEMPTS && !claimed; attempt += 1) {
      const placement = await findAvailableParent(sponsorId, activeSession);
      placementSide = placement.placementSide;

      await assertPlacementSafe(userId, placement.parentId, activeSession);

      claimed = await atomicClaimBinarySlot(placement.parentId, placementSide, user._id, activeSession);

      if (claimed) {
        parent = await User.findById(placement.parentId).session(activeSession);
        sequence = await nextPlacementSequence(activeSession);

        user.sponsorId = sponsorId;
        user.directSponsor = sponsorId;
        user.parentId = parent._id;
        user.placementSide = placementSide;
        user.placementIndex = sequence;
        user.placementSequence = sequence;
        user.activePlacement = true;
        user.binaryStatus = 'open_left';
        user.manualPlacement = false;
        user.placementHistory.push({
          fromSponsorId: null,
          toSponsorId: parent._id,
          fromSide: null,
          toSide: placementSide,
          fromIndex: null,
          toIndex: sequence,
          movedBy: actorUserId,
          movedAt: new Date(),
          reason: reason || 'bfs auto placement',
        });
        await user.save({ session: activeSession });

        pairCredit = await refreshNodeBinaryState(parent._id, activeSession);
        break;
      }
    }

    if (!claimed) {
      const err = new Error('Could not allocate a binary slot; please retry');
      err.statusCode = 503;
      throw err;
    }

    if (ownSession) await activeSession.commitTransaction();

    return {
      placement: {
        userId: String(user._id),
        sponsorId: String(sponsorId),
        parentId: String(parent._id),
        placementSide,
        placementSequence: sequence,
      },
      pairCredit,
    };
  } catch (err) {
    if (ownSession) await activeSession.abortTransaction().catch(() => {});
    throw err;
  } finally {
    if (ownSession) await activeSession.endSession();
  }
}

export const placeUserInBinary = placeUserUnderSponsor;

export async function setPlacementSide({ userId, newSide, actorUserId = null, reason = 'manual side override', session = null }) {
  ensureValidSide(newSide);

  const ownSession = !session;
  const activeSession = session ?? (await mongoose.startSession());
  if (ownSession) activeSession.startTransaction();

  try {
    const user = await User.findById(userId).session(activeSession);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    if (!user.parentId) {
      const err = new Error('User has no placement parent');
      err.statusCode = 400;
      throw err;
    }
    if (user.placementSide === newSide) {
      if (ownSession) await activeSession.commitTransaction();
      return { changed: false };
    }

    const parent = await User.findById(user.parentId).session(activeSession);
    if (!parent) {
      const err = new Error('Placement parent not found');
      err.statusCode = 404;
      throw err;
    }

    const oldField = user.placementSide === 'left' ? 'leftChild' : 'rightChild';
    const newField = newSide === 'left' ? 'leftChild' : 'rightChild';
    if (parent[newField] && String(parent[newField]) !== String(user._id)) {
      const err = new Error(`${newSide.toUpperCase()} leg is already occupied`);
      err.statusCode = 409;
      throw err;
    }

    parent[oldField] = null;
    parent[newField] = user._id;
    await parent.save({ session: activeSession });

    user.placementHistory.push({
      fromSponsorId: parent._id,
      toSponsorId: parent._id,
      fromSide: user.placementSide,
      toSide: newSide,
      fromIndex: user.placementSequence,
      toIndex: user.placementSequence,
      movedBy: actorUserId,
      movedAt: new Date(),
      reason,
    });
    user.placementSide = newSide;
    user.manualPlacement = true;
    await user.save({ session: activeSession });
    const pairCredit = await refreshNodeBinaryState(parent._id, activeSession);

    if (ownSession) await activeSession.commitTransaction();
    return { changed: true, pairCredit };
  } catch (err) {
    if (ownSession) await activeSession.abortTransaction().catch(() => {});
    throw err;
  } finally {
    if (ownSession) await activeSession.endSession();
  }
}

export async function refreshBinaryState(nodeId, session = null) {
  return refreshNodeBinaryState(nodeId, session);
}
