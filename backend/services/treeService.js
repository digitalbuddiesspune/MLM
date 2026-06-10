/**
 * Binary placement reads for UI + reporting.
 *
 * Auto placement: sponsor left/right first, then one-directional spill in sponsor's left leg.
 */
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';

const FIELDS_FOR_TREE =
  '_id name email mobile referralNumber sponsorId directSponsor parentId leftChild rightChild ' +
  'placementSide placementIndex placementSequence pairMatched activePlacement binaryStatus ' +
  'binaryLeftCount binaryRightCount pairCount binaryIncome manualPlacement placementFrozen isActive role';

async function latestPaidPackageNamesByUserId(userMongoIds) {
  if (!userMongoIds.length) return new Map();
  const oids = userMongoIds.map((id) => new mongoose.Types.ObjectId(id));
  const rows = await Order.aggregate([
    { $match: { userId: { $in: oids }, status: 'paid' } },
    { $sort: { paidAt: -1 } },
    { $group: { _id: '$userId', package: { $first: '$productSnapshot.name' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.package ?? '\u2014']));
}

function collectTreeNodeIds(node, acc) {
  if (!node) return;
  acc.push(node.id);
  for (const ch of node.children ?? []) collectTreeNodeIds(ch, acc);
}

async function attachPackages(rootNode) {
  const ids = [];
  collectTreeNodeIds(rootNode, ids);
  const map = await latestPaidPackageNamesByUserId(ids);
  function walk(n) {
    n.package = map.get(String(n.id)) ?? null;
    for (const ch of n.children ?? []) walk(ch);
  }
  walk(rootNode);
}

/**
 * Canonical tree nodes for API consumers (React Flow, mobile, etc.).
 */
export function shapeCanonicalBinaryPayload(internalRoot) {
  if (!internalRoot) return null;
  return {
    _id: internalRoot.id,
    name: internalRoot.name ?? '—',
    position: internalRoot.placementSide ?? null,
    referralNumber: internalRoot.referralNumber ?? null,
    package: internalRoot.package ?? '—',
    status: internalRoot.isActive ? 'active' : 'inactive',
    binaryLeftCount: internalRoot.binaryLeftCount ?? 0,
    binaryRightCount: internalRoot.binaryRightCount ?? 0,
    matchingIncome: internalRoot.binaryIncome ?? 0,
    depth: internalRoot.level ?? 0,
    children: (internalRoot.children ?? []).map(shapeCanonicalBinaryPayload),
  };
}

function shapeTreeNode(doc, depth) {
  return {
    id: String(doc._id),
    name: doc.name ?? '—',
    email: doc.email ?? null,
    mobile: doc.mobile ?? null,
    referralNumber: doc.referralNumber ?? null,
    role: doc.role ?? 'user',
    isActive: !!doc.isActive,
    sponsorId: doc.sponsorId ? String(doc.sponsorId) : null,
    directSponsor: doc.directSponsor ? String(doc.directSponsor) : null,
    parentId: doc.parentId ? String(doc.parentId) : null,
    leftChild: doc.leftChild ? String(doc.leftChild) : null,
    rightChild: doc.rightChild ? String(doc.rightChild) : null,
    placementSide: doc.placementSide ?? null,
    placementIndex: doc.placementIndex ?? 0,
    placementSequence: doc.placementSequence ?? 0,
    pairMatched: !!doc.pairMatched,
    activePlacement: !!doc.activePlacement,
    binaryStatus: doc.binaryStatus ?? 'open_left',
    binaryLeftCount: doc.binaryLeftCount ?? 0,
    binaryRightCount: doc.binaryRightCount ?? 0,
    pairCount: doc.pairCount ?? 0,
    binaryIncome: doc.binaryIncome ?? 0,
    manualPlacement: !!doc.manualPlacement,
    placementFrozen: !!doc.placementFrozen,
    package: null,
    level: depth,
    children: [],
  };
}

/**
 * Sponsor referral chain: Level 1 = users who registered with root's referral ID;
 * Level 2 = users who registered with a Level 1 member's referral ID; and so on.
 *
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {number} [maxDepth=6]
 * @param {{ withPackages?: boolean }} [opts]
 */
export async function getReferralTree(userId, maxDepth = 6, opts = {}) {
  if (!mongoose.isValidObjectId(userId)) return null;

  const root = await User.findById(userId).select(FIELDS_FOR_TREE).lean();
  if (!root) return null;

  const rootNode = shapeTreeNode(root, 0);
  let frontier = [rootNode];

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
    const parentIds = frontier.map((node) => new mongoose.Types.ObjectId(node.id));
    const children = await User.find({ sponsorId: { $in: parentIds } })
      .select(FIELDS_FOR_TREE)
      .sort({ createdAt: 1 })
      .lean();

    const bySponsorId = new Map();
    for (const doc of children) {
      const sponsorKey = String(doc.sponsorId);
      if (!bySponsorId.has(sponsorKey)) bySponsorId.set(sponsorKey, []);
      bySponsorId.get(sponsorKey).push(doc);
    }

    const nextFrontier = [];
    for (const parent of frontier) {
      for (const doc of bySponsorId.get(parent.id) ?? []) {
        const childNode = shapeTreeNode(doc, depth + 1);
        parent.children.push(childNode);
        nextFrontier.push(childNode);
      }
    }
    frontier = nextFrontier;
  }

  const withPkgs = opts.withPackages !== false;
  if (withPkgs) await attachPackages(rootNode);
  return rootNode;
}

async function expandBinaryPlacement(node, depth, maxDepth) {
  if (depth >= maxDepth) return;
  const ids = [node.leftChild, node.rightChild].filter(Boolean);
  if (ids.length === 0) return;
  const children = await User.find({ _id: { $in: ids } }).select(FIELDS_FOR_TREE).lean();
  const byId = new Map(children.map((child) => [String(child._id), child]));
  for (const id of ids) {
    const child = byId.get(String(id));
    if (!child) continue;
    const childNode = shapeTreeNode(child, depth + 1);
    node.children.push(childNode);
    await expandBinaryPlacement(childNode, depth + 1, maxDepth);
  }
}

/**
 * Binary placement tree for `/api/user/binary-tree` and admin tools.
 * Children = leftChild/rightChild pointers (not sponsor referrals).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number | null} maxDepth omit or `"all"` style handled by controller
 * @param {{ rootOverride?: string, withPackages?: boolean }} [opts]
 */
export async function getBinaryTree(userId, maxDepth = null, opts = {}) {
  const cap = maxDepth == null || !Number.isFinite(maxDepth) || maxDepth < 1 ? 12 : Math.min(50, Math.floor(maxDepth));
  const target = opts.rootOverrideId ?? userId;
  if (!mongoose.isValidObjectId(target)) return null;

  const root = await User.findById(target).select(FIELDS_FOR_TREE).lean();
  if (!root) return null;

  const rootNode = shapeTreeNode(root, 0);
  await expandBinaryPlacement(rootNode, 0, cap);
  const withPkgs = opts.withPackages !== false;
  if (withPkgs) await attachPackages(rootNode);
  return rootNode;
}

/**
 * Canonical MLM tree payload (requested wire format).
 */
export async function getMlBinaryWireTree(rootUserId, maxDepth = 10) {
  const internal = await getBinaryTree(rootUserId, maxDepth, {});
  return shapeCanonicalBinaryPayload(internal);
}

/* Placement: direct sponsor legs first, then one-directional left-leg spill. Pair match requires direct recruits on both legs. */
