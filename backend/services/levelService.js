import User from '../models/User.js';
import { addIncome } from './walletService.js';

const LEVELS = [
  {
    level: 6,
    name: 'Diamond',
    minUsers: 100000,
    reward: 'Four Wheeler',
    joiningBonus: 8,
  },
  {
    level: 5,
    name: 'Gold',
    minUsers: 20000,
    reward: 'Two Wheeler',
    joiningBonus: 10,
  },
  {
    level: 4,
    name: 'Platinum',
    minUsers: 5000,
    reward: 'Laptop',
    joiningBonus: 10,
  },
  {
    level: 3,
    name: 'Silver',
    minUsers: 1000,
    reward: 'Mobile',
    joiningBonus: 10,
  },
  {
    level: 2,
    name: 'Rubi Star',
    minUsers: 100,
    reward: 'Digital Watch',
    joiningBonus: 10,
  },
  {
    level: 1,
    name: 'Star',
    minUsers: 10,
    reward: 'Remote',
    joiningBonus: 20,
  },
];

const DEFAULT_LEVEL = {
  level: 0,
  name: 'Beginner',
  minUsers: 0,
  reward: '',
  joiningBonus: 0,
};

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Returns level metadata for a direct referral count.
 * @param {number} sponsoredUsersCount
 * @returns {{ level: number, name: string, minUsers: number, reward: string, joiningBonus: number }}
 */
export function getLevelFromSponsoredCount(sponsoredUsersCount) {
  const total = Number.isFinite(sponsoredUsersCount) ? Math.max(0, sponsoredUsersCount) : 0;
  return LEVELS.find((item) => total >= item.minUsers) ?? DEFAULT_LEVEL;
}

/**
 * Updates a user's level fields from current direct referral count.
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @param {import('mongoose').ClientSession | null} [session=null]
 * @returns {Promise<{ sponsoredUsersCount: number, level: number, name: string, reward: string, joiningBonus: number }>}
 */
export async function syncUserLevel(userId, session = null) {
  const countQuery = User.countDocuments({ sponsorId: userId });
  if (session) countQuery.session(session);
  const sponsoredUsersCount = await countQuery;

  const levelInfo = getLevelFromSponsoredCount(sponsoredUsersCount);

  const update = {
    sponsoredUsersCount,
    level: levelInfo.level,
    rank: levelInfo.name,
    levelReward: levelInfo.reward,
    joiningBonusAmount: levelInfo.joiningBonus,
  };

  const updateQuery = User.findByIdAndUpdate(userId, { $set: update }, { new: true });
  if (session) updateQuery.session(session);
  await updateQuery;

  return {
    sponsoredUsersCount,
    level: levelInfo.level,
    name: levelInfo.name,
    reward: levelInfo.reward,
    joiningBonus: levelInfo.joiningBonus,
  };
}

/**
 * Auto-activates uplines when both left and right child nodes exist.
 * Runs from the provided parent up to root.
 * @param {import('mongoose').Types.ObjectId | string | null} startParentId
 * @param {import('mongoose').ClientSession | null} [session=null]
 * @returns {Promise<number>} number of users auto-activated
 */
export async function autoActivateEligibleUplines(startParentId, session = null) {
  let activatedCount = 0;
  let currentId = startParentId;

  while (currentId) {
    let query = User.findById(currentId)
      .select('_id parentId leftChildId rightChildId isActive activationDate renewalDate');
    if (session) query = query.session(session);
    const current = await query.lean();

    if (!current) break;

    const hasBothChildren = Boolean(current.leftChildId && current.rightChildId);
    if (hasBothChildren && !current.isActive) {
      const now = new Date();
      const renewalDate = new Date(now.getTime() + THIRTY_DAYS_IN_MS);

      let updateQuery = User.findByIdAndUpdate(
        current._id,
        {
          $set: {
            isActive: true,
            activationDate: current.activationDate ?? now,
            renewalDate: current.renewalDate ?? renewalDate,
          },
        },
        { new: true }
      );
      if (session) updateQuery = updateQuery.session(session);
      await updateQuery;
      activatedCount += 1;
    }

    currentId = current.parentId;
  }

  return activatedCount;
}

/**
 * Applies post-registration sponsor effects:
 * 1) sync sponsor level/reward/bonus based on total direct referrals
 * 2) credit sponsor with fixed joining bonus for this joining
 * @param {import('mongoose').Types.ObjectId | string | null} sponsorId
 * @param {import('mongoose').Types.ObjectId | string} joinedUserId
 * @param {import('mongoose').ClientSession | null} [session=null]
 * @returns {Promise<{ joiningBonusPaid: number, sponsorLevel: number, sponsoredUsersCount: number }>}
 */
export async function applySponsorJoinEffects(sponsorId, joinedUserId, session = null) {
  if (!sponsorId) {
    return {
      joiningBonusPaid: 0,
      sponsorLevel: 0,
      sponsoredUsersCount: 0,
    };
  }

  const levelState = await syncUserLevel(sponsorId, session);
  const joiningBonusPaid = levelState.joiningBonus;

  if (joiningBonusPaid > 0) {
    await addIncome(sponsorId, joiningBonusPaid, 'joining_bonus', joinedUserId, session);
  }

  return {
    joiningBonusPaid,
    sponsorLevel: levelState.level,
    sponsoredUsersCount: levelState.sponsoredUsersCount,
  };
}

export { LEVELS, DEFAULT_LEVEL };
