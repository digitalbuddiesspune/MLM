import mongoose from 'mongoose';
import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import Order from '../models/Order.js';

const NODE_FIELDS =
  '_id name email mobile referralNumber sponsorId directSponsor parentId leftChild rightChild ' +
  'placementSide placementIndex placementSequence pairMatched activePlacement binaryStatus ' +
  'binaryLeftCount binaryRightCount pairCount binaryIncome manualPlacement placementFrozen spilloverRedirect isActive role';

/**
 * Build the real unidirectional binary placement tree rooted at `rootUserId`.
 * Children are leftChild/rightChild pointers, so the UI reflects MLM spillover flow.
 *
 * @param {string|mongoose.Types.ObjectId} rootUserId
 * @param {number} [maxDepth=6]
 */
export async function buildSponsorTree(rootUserId, maxDepth = 6) {
  if (!mongoose.isValidObjectId(rootUserId)) return null;

  const root = await User.findById(rootUserId).select(NODE_FIELDS).lean();
  if (!root) return null;

  function shape(doc, depth) {
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
      spilloverRedirect: doc.spilloverRedirect ? String(doc.spilloverRedirect) : null,
      depth,
      children: [],
    };
  }

  const rootNode = shape(root, 0);

  async function expand(node, depth) {
    if (depth >= maxDepth) return;
    const ids = [node.leftChild, node.rightChild].filter(Boolean);
    if (ids.length === 0) return;
    const children = await User.find({ _id: { $in: ids } })
      .select(NODE_FIELDS)
      .lean();
    const byId = new Map(children.map((child) => [String(child._id), child]));
    for (const id of ids) {
      const child = byId.get(String(id));
      if (!child) continue;
      const childNode = shape(child, depth + 1);
      node.children.push(childNode);
      await expand(childNode, depth + 1);
    }
  }

  await expand(rootNode, 0);
  return rootNode;
}

/**
 * Flat binary downline list (walks left/right placement pointers).
 */
export async function flatDownline(rootUserId, maxDepth = 10) {
  if (!mongoose.isValidObjectId(rootUserId)) return [];

  const result = [];
  const queue = [{ id: String(rootUserId), depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (depth >= maxDepth) continue;
    const parent = await User.findById(id).select('leftChild rightChild').lean();
    const ids = [parent?.leftChild, parent?.rightChild].filter(Boolean);
    const children = await User.find({ _id: { $in: ids } }).select(NODE_FIELDS).lean();
    const byId = new Map(children.map((child) => [String(child._id), child]));
    for (const childId of ids) {
      const c = byId.get(String(childId));
      if (!c) continue;
      result.push({
        id: String(c._id),
        name: c.name,
        email: c.email,
        mobile: c.mobile,
        referralNumber: c.referralNumber,
        sponsorId: c.sponsorId ? String(c.sponsorId) : null,
        parentId: c.parentId ? String(c.parentId) : null,
        placementSide: c.placementSide,
        placementIndex: c.placementIndex,
        placementSequence: c.placementSequence ?? 0,
        pairMatched: !!c.pairMatched,
        binaryStatus: c.binaryStatus ?? 'open_left',
        depth: depth + 1,
      });
      queue.push({ id: String(c._id), depth: depth + 1 });
    }
  }
  return result;
}

/**
 * Pair / income summary for one binary node.
 */
export async function getPairsSummary(userId) {
  if (!mongoose.isValidObjectId(userId)) return null;

  const user = await User.findById(userId).select('binaryLeftCount binaryRightCount pairCount binaryIncome pairMatched binaryStatus').lean();
  if (!user) return null;

  return {
    binaryLeftCount: user.binaryLeftCount ?? 0,
    binaryRightCount: user.binaryRightCount ?? 0,
    pairCount: user.pairCount ?? 0,
    binaryIncome: user.binaryIncome ?? 0,
    pairMatched: !!user.pairMatched,
    binaryStatus: user.binaryStatus ?? 'open_left',
  };
}

/**
 * Lifetime binary ledger summary (sum of `binary` ledger entries for this user).
 */
export async function getBinaryIncomeSummary(userId) {
  if (!mongoose.isValidObjectId(userId)) return { total: 0, entries: 0 };
  const oid = new mongoose.Types.ObjectId(userId);

  const [agg] = await Ledger.aggregate([
    { $match: { userId: oid, type: 'binary', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' }, entries: { $sum: 1 } } },
  ]);

  return {
    total: Number(agg?.total ?? 0),
    entries: Number(agg?.entries ?? 0),
  };
}

/** Max nodes scanned searching a placement subtree during auth checks */
const BINARY_TEAM_SCAN_LIMIT = 50_000;

/**
 * Membership in a binary PLACEMENT subtree: BFS LEFT/RIGHT from `ancestorId`
 * (`sponsorId` alone is not sufficient — placements can spill without `parentId` pointing at the recruiter).
 */
export async function isBinaryDescendantOrSelf(ancestorId, maybeDescendantId, session = null) {
  if (!mongoose.isValidObjectId(ancestorId) || !mongoose.isValidObjectId(maybeDescendantId)) return false;
  if (String(ancestorId) === String(maybeDescendantId)) return true;

  const target = String(maybeDescendantId);
  const queue = [String(ancestorId)];
  const visited = new Set(queue);
  let scanned = 0;

  while (queue.length > 0 && scanned < BINARY_TEAM_SCAN_LIMIT) {
    scanned += 1;
    const id = queue.shift();
    const nodeQ = User.findById(id).select('leftChild rightChild').lean();
    const node = session ? await nodeQ.session(session) : await nodeQ;
    if (!node) continue;
    const legs = [node.leftChild, node.rightChild].filter(Boolean).map(String);
    for (const c of legs) {
      if (c === target) return true;
      if (!visited.has(c)) {
        visited.add(c);
        queue.push(c);
      }
    }
  }

  return false;
}

async function collectSubtreeUserIds(seedId, acc = [], session = null) {
  if (!mongoose.isValidObjectId(seedId)) return acc;
  acc.push(String(seedId));
  const q = User.findById(seedId).select('leftChild rightChild').lean();
  const u = session ? await q.session(session) : await q;
  if (!u) return acc;
  if (u.leftChild) await collectSubtreeUserIds(u.leftChild, acc, session);
  if (u.rightChild) await collectSubtreeUserIds(u.rightChild, acc, session);
  return acc;
}

async function aggregateBusinessForUserIds(ids) {
  if (!ids.length) return { businessVolume: 0, turnover: 0 };
  const oids = [...new Set(ids)].map((id) => new mongoose.Types.ObjectId(id));
  const [agg] = await Order.aggregate([
    { $match: { userId: { $in: oids }, status: 'paid' } },
    {
      $group: {
        _id: null,
        businessVolume: { $sum: { $ifNull: ['$productSnapshot.businessVolume', 0] } },
        turnover: { $sum: { $ifNull: ['$amount', 0] } },
      },
    },
  ]);
  return {
    businessVolume: Number(agg?.businessVolume ?? 0),
    turnover: Number(agg?.turnover ?? 0),
  };
}

/** Dashboard metrics for `/api/user/binary-dashboard`. */
export async function getBinaryDashboardSnapshot(viewerUserId, session = null) {
  if (!mongoose.isValidObjectId(viewerUserId)) return null;

  const viewerQ = User.findById(viewerUserId)
    .select(
      '_id name referralNumber leftChild rightChild binaryLeftCount binaryRightCount binaryIncome pairCount pairMatched sponsoredUsersCount'
    )
    .lean();
  const viewer = session ? await viewerQ.session(session) : await viewerQ;
  if (!viewer) return null;

  const leftLegIds =
    viewer.leftChild && mongoose.isValidObjectId(viewer.leftChild)
      ? await collectSubtreeUserIds(viewer.leftChild, [], session)
      : [];
  const rightLegIds =
    viewer.rightChild && mongoose.isValidObjectId(viewer.rightChild)
      ? await collectSubtreeUserIds(viewer.rightChild, [], session)
      : [];

  const entireIds = [...leftLegIds, ...rightLegIds];
  const [leftBiz, rightBiz, matchingFromLedger] = await Promise.all([
    aggregateBusinessForUserIds(leftLegIds),
    aggregateBusinessForUserIds(rightLegIds),
    getBinaryIncomeSummary(viewerUserId),
  ]);

  const rootOid = new mongoose.Types.ObjectId(viewerUserId);
  const recentJoins = await User.find({ sponsorId: rootOid })
    .sort({ createdAt: -1 })
    .limit(12)
    .select('name referralNumber isActive createdAt')
    .lean();

  return {
    viewer: {
      id: String(viewerUserId),
      referralNumber: viewer.referralNumber ?? null,
      pairCount: viewer.pairCount ?? 0,
      pairMatched: !!viewer.pairMatched,
      binaryIncome: viewer.binaryIncome ?? 0,
      directReferrals: viewer.sponsoredUsersCount ?? 0,
    },
    totals: {
      totalTeam: entireIds.length,
      leftLegMembers: leftLegIds.length,
      rightLegMembers: rightLegIds.length,
      leftBusinessVolume: leftBiz.businessVolume,
      rightBusinessVolume: rightBiz.businessVolume,
      leftTurnover: leftBiz.turnover,
      rightTurnover: rightBiz.turnover,
    },
    matchingIncomeFromLedger: matchingFromLedger.total,
    recentJoins: recentJoins.map((u) => ({
      id: String(u._id),
      name: u.name,
      referralNumber: u.referralNumber,
      status: u.isActive ? 'active' : 'inactive',
      joinedAt: u.createdAt,
    })),
  };
}

/**
 * Breadcrumb ancestors from viewer root down toward `leafUserId`.
 * Returns null when `leafUserId` is not under same binary chain as viewer root expectation.
 *
 * Caller should ensure `ancestorRootId` is the subtree root displayed (normally the logged-in user).
 */
export async function getBinaryGenealogyPath(ancestorRootId, leafUserId, session = null) {
  if (
    !mongoose.isValidObjectId(ancestorRootId) ||
    !mongoose.isValidObjectId(leafUserId)
  ) {
    return null;
  }

  if (!(await isBinaryDescendantOrSelf(ancestorRootId, leafUserId, session))) {
    const err = new Error('Requested member is outside your placement tree');
    err.statusCode = 403;
    throw err;
  }

  const steps = [];
  let curId = leafUserId;
  for (;;) {
    const nodeQ = User.findById(curId)
      .select('_id name referralNumber placementSide parentId isActive binaryLeftCount binaryRightCount binaryIncome pairCount')
      .lean();
    const node = session ? await nodeQ.session(session) : await nodeQ;
    if (!node) return null;

    steps.unshift({
      _id: String(node._id),
      name: node.name ?? '—',
      referralNumber: node.referralNumber ?? null,
      position: node.placementSide ?? null,
      status: node.isActive ? 'active' : 'inactive',
      binaryLeftCount: node.binaryLeftCount ?? 0,
      binaryRightCount: node.binaryRightCount ?? 0,
      matchingIncome: node.binaryIncome ?? 0,
      pairCount: node.pairCount ?? 0,
      parentId: node.parentId ? String(node.parentId) : null,
    });

    if (String(node._id) === String(ancestorRootId)) break;
    if (!node.parentId) {
      const err = new Error('Broken binary genealogy chain');
      err.statusCode = 422;
      throw err;
    }
    curId = node.parentId;
  }

  return { breadcrumb: steps };
}
