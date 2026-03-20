import mongoose from 'mongoose';
import User from '../models/User.js';

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

/**
 * Builds a binary tree structure rooted at the given user, up to maxDepth levels.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {number} [maxDepth=6]
 * @returns {Promise<{ id: string, name: string, email?: string, position: string | null, level: number, left?: object, right?: object } | null>}
 */
export async function getBinaryTree(userId, maxDepth = 6) {
  const root = await User.findById(userId).select(FIELDS_FOR_TREE).lean();
  if (!root) return null;

  async function buildNode(doc, level, position) {
    if (!doc || level > maxDepth) return null;
    const node = {
      id: String(doc._id),
      name: doc.name || '—',
      email: doc.email,
      position: doc.position || null,
      level,
      left: null,
      right: null,
    };
    if (level < maxDepth) {
      if (doc.leftChildId) {
        const leftDoc = await User.findById(doc.leftChildId).select(FIELDS_FOR_TREE).lean();
        node.left = leftDoc ? await buildNode(leftDoc, level + 1, 'left') : null;
      }
      if (doc.rightChildId) {
        const rightDoc = await User.findById(doc.rightChildId).select(FIELDS_FOR_TREE).lean();
        node.right = rightDoc ? await buildNode(rightDoc, level + 1, 'right') : null;
      }
    }
    return node;
  }

  return buildNode(root, 0, null);
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
