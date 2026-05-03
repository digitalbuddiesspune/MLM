import Counter from '../models/Counter.js';
import User from '../models/User.js';

const COUNTER_ID = 'userReferral';
export const FIRST_REFERRAL_NUMBER = 100_001;

/**
 * Allocates next unique referral number (atomic via Counter + aggregation pipeline).
 */
export async function nextReferralNumber(session = null) {
  const opts = {
    new: true,
    upsert: true,
    updatePipeline: true,
    ...(session ? { session } : {}),
  };

  const doc = await Counter.findOneAndUpdate(
    { _id: COUNTER_ID },
    [{ $set: { seq: { $add: [{ $ifNull: ['$seq', 100_000] }, 1] } } }],
    opts
  );

  return doc.seq;
}

/**
 * Assigns referralNumber if missing (for existing accounts).
 */
export async function ensureReferralNumber(userId, session = null) {
  if (!userId) return null;

  const load = async () => {
    const q = User.findById(userId).select('referralNumber');
    const doc = session ? await q.session(session).lean() : await q.lean();
    return doc;
  };

  let user = await load();
  if (!user) return null;
  if (user.referralNumber != null) return user.referralNumber;

  for (let attempt = 0; attempt < 15; attempt += 1) {
    const num = await nextReferralNumber(session);

    try {
      const upd = User.findOneAndUpdate(
        { _id: userId, referralNumber: { $exists: false } },
        { $set: { referralNumber: num } },
        { new: true }
      );
      const updated = session ? await upd.session(session).lean() : await upd.lean();

      if (updated?.referralNumber != null) return updated.referralNumber;

      user = await load();
      if (user?.referralNumber != null) return user.referralNumber;
    } catch (e) {
      if (e?.code !== 11000) throw e;
    }
  }

  throw new Error('Could not allocate referralNumber');
}
