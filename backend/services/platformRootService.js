import User from '../models/User.js';

/**
 * Platform root = earliest admin with no sponsor, else earliest user with no sponsor.
 * This account is the centralized binary tree root.
 */
export async function getPlatformRootUserId() {
  const adminRoot = await User.findOne({ role: 'admin', sponsorId: null })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();
  if (adminRoot) return String(adminRoot._id);

  const anyRoot = await User.findOne({ sponsorId: null })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();
  return anyRoot ? String(anyRoot._id) : null;
}

export async function getPlatformRootUser() {
  const rootId = await getPlatformRootUserId();
  if (!rootId) return null;
  return User.findById(rootId)
    .select('_id name email mobile referralNumber role sponsorId parentId createdAt')
    .lean();
}
