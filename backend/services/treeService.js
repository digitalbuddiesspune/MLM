import mongoose from 'mongoose';
import User from '../models/User.js';
import BinaryStats from '../models/BinaryStats.js';
import Ledger from '../models/Ledger.js';

const FIELDS_FOR_PLACEMENT = '_id leftChildId rightChildId';
const FIELDS_FOR_TREE = '_id name email leftChildId rightChildId position';
const FIELDS_FOR_REFERRAL = '_id name email mobile';
const FIELDS_BINARY_SLOTS = '_id leftChildId rightChildId';
const MAX_BFS_ITERATIONS = 1_000_000;

/**
 * Inserts a new user into the binary MLM tree as a complete binary tree (level-order, left-first).
 * Uses only parentId, leftChildId, rightChildId. Atomic updates prevent duplicate placement.
 *
 * @param {import('mongoose').Types.ObjectId} rootUserId - Root of the tree to insert under
 * @param {import('mongoose').Types.ObjectId} newUserId - User to place in the tree
 * @returns {Promise<{ parent: import('mongoose').Document, placement: { parentId: import('mongoose').Types.ObjectId, position: 'left' | 'right' } }>}
 * @throws {Error} When root/new user not found, new user already placed, or tree full
 */
export async function insertUserInBinaryTree(rootUserId, newUserId) {
  if (!rootUserId || !newUserId) {
    const err = new Error('rootUserId and newUserId are required');
    err.statusCode = 400;
    throw err;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const root = await User.findById(rootUserId).select(FIELDS_BINARY_SLOTS).session(session).lean();
    if (!root) {
      const err = new Error('Root user not found');
      err.statusCode = 404;
      throw err;
    }

    const newUser = await User.findById(newUserId).select('parentId').session(session).lean();
    if (!newUser) {
      const err = new Error('New user not found');
      err.statusCode = 404;
      throw err;
    }
    if (newUser.parentId != null) {
      const err = new Error('User is already placed in the tree');
      err.statusCode = 422;
      throw err;
    }

    const queue = [rootUserId];
    let iterations = 0;

    while (queue.length > 0 && iterations < MAX_BFS_ITERATIONS) {
      iterations += 1;
      const parentId = queue.shift();

      const parent = await User.findById(parentId).select(FIELDS_BINARY_SLOTS).session(session).lean();
      if (!parent) continue;

      if (parent.leftChildId == null) {
        const updatedParent = await User.findOneAndUpdate(
          { _id: parentId, leftChildId: null },
          { $set: { leftChildId: newUserId } },
          { session, new: true }
        ).select(FIELDS_BINARY_SLOTS);

        if (updatedParent) {
          await User.updateOne(
            { _id: newUserId },
            { $set: { parentId, position: 'left' } },
            { session }
          );
          await session.commitTransaction();
          return {
            parent: updatedParent,
            placement: { parentId, position: 'left' },
          };
        }
        const current = await User.findById(parentId).select(FIELDS_BINARY_SLOTS).session(session).lean();
        if (current?.leftChildId) queue.push(current.leftChildId);
        if (current?.rightChildId) queue.push(current.rightChildId);
        continue;
      }

      if (parent.rightChildId == null) {
        const updatedParent = await User.findOneAndUpdate(
          { _id: parentId, rightChildId: null },
          { $set: { rightChildId: newUserId } },
          { session, new: true }
        ).select(FIELDS_BINARY_SLOTS);

        if (updatedParent) {
          await User.updateOne(
            { _id: newUserId },
            { $set: { parentId, position: 'right' } },
            { session }
          );
          await session.commitTransaction();
          return {
            parent: updatedParent,
            placement: { parentId, position: 'right' },
          };
        }
        const current = await User.findById(parentId).select(FIELDS_BINARY_SLOTS).session(session).lean();
        if (current?.leftChildId) queue.push(current.leftChildId);
        if (current?.rightChildId) queue.push(current.rightChildId);
        continue;
      }

      queue.push(parent.leftChildId, parent.rightChildId);
    }

    await session.abortTransaction();
    const err = new Error('No placement available: tree is full or max iterations reached');
    err.statusCode = 422;
    throw err;
  } catch (e) {
    await session.abortTransaction().catch(() => {});
    throw e;
  } finally {
    session.endSession();
  }
}

/**
 * Builds a referral tree: only users who were created with this user's referral ID (sponsorId).
 * Root = current user. Children = users where sponsorId = root. Recursive by sponsorId chain.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {number} [maxDepth=6]
 * @returns {Promise<{ id: string, name: string, email?: string, level: number, children: object[] } | null>}
 */
export async function getReferralTree(userId, maxDepth = 6) {
  const root = await User.findById(userId).select(FIELDS_FOR_REFERRAL).lean();
  if (!root) return null;

  async function buildNode(doc, level) {
    if (!doc || level > maxDepth) return null;
    const node = {
      id: String(doc._id),
      name: doc.name || '—',
      email: doc.email,
      mobile: doc.mobile,
      level,
      children: [],
    };
    if (level < maxDepth) {
      const directReferrals = await User.find({ sponsorId: doc._id })
        .select(FIELDS_FOR_REFERRAL)
        .sort({ createdAt: 1 })
        .lean();
      for (const child of directReferrals) {
        const childNode = await buildNode(child, level + 1);
        if (childNode) node.children.push(childNode);
      }
    }
    return node;
  }

  return buildNode(root, 0);
}

const MAX_TREE_API_DEPTH = 50;

function placeholderChild(id, level, side) {
  return {
    truncated: true,
    placeholder: true,
    id: String(id),
    name: '⋯',
    email: undefined,
    position: side,
    level,
    left: null,
    right: null,
  };
}

/** Collect Mongo user ids present as real nodes in the built tree snapshot. */
function collectTreeUserIds(node, /** @type {Set<string>} */ set = new Set()) {
  if (!node || node.placeholder) return set;
  if (node.id) set.add(String(node.id));
  if (node.left) collectTreeUserIds(node.left, set);
  if (node.right) collectTreeUserIds(node.right, set);
  return set;
}

/**
 * Attaches verified placement/matching summaries for dashboard tree (slots, pair count, ₹ binary paid).
 * @param {object | null} tree
 */
async function attachMatchingVerificationToTree(tree) {
  if (!tree) return null;

  const idStrings = [...collectTreeUserIds(tree)].filter(Boolean);
  if (idStrings.length === 0) return tree;

  const oidList = idStrings.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
  if (oidList.length === 0) return tree;

  const [slotRows, statsRows, ledgerAgg] = await Promise.all([
    User.find({ _id: { $in: oidList } }).select('_id leftChildId rightChildId').lean(),
    BinaryStats.find({ userId: { $in: oidList } }).select('userId totalMatchedPairs').lean(),
    Ledger.aggregate([
      { $match: { userId: { $in: oidList }, type: 'binary', status: 'completed' } },
      { $group: { _id: '$userId', total: { $sum: '$amount' } } },
    ]),
  ]);

  /** @type {Record<string, { bothLegsOccupied: boolean }>} */
  const slotMap = {};
  for (const r of slotRows) {
    slotMap[String(r._id)] = {
      bothLegsOccupied: !!(r.leftChildId && r.rightChildId),
    };
  }

  /** @type {Record<string, { totalMatchedPairs: number }>} */
  const statsMap = {};
  for (const r of statsRows) {
    statsMap[String(r.userId)] = {
      totalMatchedPairs: Number(r.totalMatchedPairs ?? 0),
    };
  }

  /** @type {Record<string, number>} */
  const earningMap = {};
  for (const row of ledgerAgg) {
    earningMap[String(row._id)] = Number(Number(row.total ?? 0).toFixed(2));
  }

  /** @returns {typeof tree} */
  function adorn(node) {
    if (!node || node.placeholder) return node;

    const id = String(node.id);
    const slots = slotMap[id] ?? { bothLegsOccupied: false };
    const matchedPairs = statsMap[id]?.totalMatchedPairs ?? 0;
    const binaryIncomePaid = earningMap[id] ?? 0;
    const hasEarnedMatching = matchedPairs > 0 || binaryIncomePaid > 0;

    /** @type {typeof node & { matchingStatus?: object }} */
    const next = {
      ...node,
      matchingStatus: {
        bothLegsOccupied: slots.bothLegsOccupied,
        totalMatchedPairs: matchedPairs,
        binaryIncomePaid,
        hasEarnedMatching,
      },
    };

    next.left = node.left ? adorn(node.left) : null;
    next.right = node.right ? adorn(node.right) : null;
    return next;
  }

  return adorn(tree);
}

/**
 * Builds a binary placement subtree rooted at the given user.
 * If maxDepth is set (≥1), recursion stops past that depth; edges show placeholders so the UI can ask for a deeper load.
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {number | null} [maxDepth] - null / undefined = unlimited (use cautiously)
 * @returns {Promise<{ id: string, name: string, email?: string, position: string | null, level: number, left?: object, right?: object, truncated?: boolean, placeholder?: boolean } | null>}
 */
export async function getBinaryTree(userId, maxDepth = null) {
  const depthCap =
    maxDepth != null &&
    Number.isFinite(maxDepth) &&
    maxDepth >= 1 &&
    maxDepth <= MAX_TREE_API_DEPTH
      ? Math.floor(maxDepth)
      : null;

  const root = await User.findById(userId).select(FIELDS_FOR_TREE).lean();
  if (!root) return null;

  async function buildNode(doc, level, position) {
    if (!doc) return null;
    const node = {
      id: String(doc._id),
      name: doc.name || '—',
      email: doc.email,
      position: doc.position || null,
      level,
      left: null,
      right: null,
    };

    const canLoadChildren = depthCap == null || level < depthCap;

    if (doc.leftChildId) {
      if (canLoadChildren) {
        const leftDoc = await User.findById(doc.leftChildId).select(FIELDS_FOR_TREE).lean();
        node.left = leftDoc ? await buildNode(leftDoc, level + 1, 'left') : null;
      } else {
        node.left = placeholderChild(doc.leftChildId, level + 1, 'left');
      }
    }
    if (doc.rightChildId) {
      if (canLoadChildren) {
        const rightDoc = await User.findById(doc.rightChildId).select(FIELDS_FOR_TREE).lean();
        node.right = rightDoc ? await buildNode(rightDoc, level + 1, 'right') : null;
      } else {
        node.right = placeholderChild(doc.rightChildId, level + 1, 'right');
      }
    }

    return node;
  }

  const built = await buildNode(root, 0, null);
  return attachMatchingVerificationToTree(built);
}

/**
 * Viewer may swap placements at parent P only if viewer is P or an upline placement parent (walk parentId upward).
 */
export async function viewerMaySwapPlacementAt(viewerUserId, placementParentId) {
  if (!mongoose.isValidObjectId(placementParentId)) {
    const err = new Error('Invalid parent id');
    err.statusCode = 400;
    throw err;
  }

  const viewer = String(viewerUserId);
  let cur = String(placementParentId);
  const seen = new Set();

  while (cur) {
    if (seen.has(cur)) {
      const err = new Error('Invalid placement chain');
      err.statusCode = 400;
      throw err;
    }
    seen.add(cur);

    if (cur === viewer) return true;

    const doc = await User.findById(cur).select('parentId').lean();
    if (!doc) {
      const err = new Error('Placement parent not found');
      err.statusCode = 404;
      throw err;
    }

    cur = doc.parentId ? String(doc.parentId) : '';
  }

  const err = new Error('You can only rearrange swaps within your own placement tree');
  err.statusCode = 403;
  throw err;
}

/**
 * Swap left/right binary legs under `placementParentId` when `viewerUserId` is allowed (see viewerMaySwapPlacementAt).
 */
export async function swapBinaryChildrenAt(viewerUserId, placementParentId) {
  await viewerMaySwapPlacementAt(viewerUserId, placementParentId);

  const session = await mongoose.startSession();

  session.startTransaction();
  try {
    const parent = await User.findById(placementParentId)
      .select('leftChildId rightChildId')
      .session(session)
      .lean();

    if (!parent) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const leftId = parent.leftChildId;
    const rightId = parent.rightChildId;

    if (!leftId || !rightId) {
      const err = new Error('Both left and right legs must have a member before you can swap sides');
      err.statusCode = 400;
      throw err;
    }

    await User.updateOne(
      { _id: placementParentId },
      { $set: { leftChildId: rightId, rightChildId: leftId } },
      { session }
    );
    await User.updateOne({ _id: leftId }, { $set: { position: 'right' } }, { session });
    await User.updateOne({ _id: rightId }, { $set: { position: 'left' } }, { session });

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Finds the first available binary placement under a sponsor's subtree.
 * - If sponsor has an empty left or right slot, returns that.
 * - If both filled, BFS down the tree to find the first node with an empty slot.
 * @param {import('mongoose').Types.ObjectId} sponsorId
 * @param {import('mongoose').ClientSession} [session] - Optional session for transaction
 * @returns {Promise<{ parentId: import('mongoose').Types.ObjectId, position: 'left' | 'right' }>}
 * @throws {Error} When sponsor is not found or no placement is available
 */
export async function findBinaryPlacement(sponsorId, session = null) {
  let sponsorQuery = User.findById(sponsorId).select(FIELDS_FOR_PLACEMENT).lean();
  if (session) sponsorQuery = sponsorQuery.session(session);
  const sponsor = await sponsorQuery;

  if (!sponsor) {
    const err = new Error('Sponsor not found');
    err.statusCode = 404;
    throw err;
  }

  if (!sponsor.leftChildId) {
    return { parentId: sponsor._id, position: 'left' };
  }

  if (!sponsor.rightChildId) {
    return { parentId: sponsor._id, position: 'right' };
  }

  const queue = [sponsor.leftChildId, sponsor.rightChildId];
  const maxNodes = 1_000_000;

  for (let processed = 0; processed < maxNodes && queue.length > 0; processed++) {
    const nodeId = queue.shift();
    let nodeQuery = User.findById(nodeId).select(FIELDS_FOR_PLACEMENT).lean();
    if (session) nodeQuery = nodeQuery.session(session);
    const node = await nodeQuery;

    if (!node) continue;

    if (!node.leftChildId) {
      return { parentId: node._id, position: 'left' };
    }

    if (!node.rightChildId) {
      return { parentId: node._id, position: 'right' };
    }

    queue.push(node.leftChildId, node.rightChildId);
  }

  const err = new Error('No placement available under this sponsor');
  err.statusCode = 422;
  throw err;
}
