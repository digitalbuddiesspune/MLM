/**
 * Places every registered user (with a sponsor) who is not yet in the binary tree.
 * Run after enabling auto-placement for existing accounts: node scripts/link-unplaced-users.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { placeUserUnderSponsor } from '../services/placementService.js';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected.');

  const pending = await User.find({
    sponsorId: { $ne: null },
    parentId: null,
  })
    .sort({ createdAt: 1 })
    .select('_id name sponsorId')
    .lean();

  console.log(`Unplaced users: ${pending.length}`);

  let placed = 0;
  let failed = 0;

  for (const user of pending) {
    try {
      await placeUserUnderSponsor({
        userId: user._id,
        sponsorId: user.sponsorId,
        manualPlacement: false,
        reason: 'link-unplaced-users script',
      });
      placed += 1;
      console.log(`  placed ${user.name ?? user._id}`);
    } catch (err) {
      failed += 1;
      console.error(`  failed ${user.name ?? user._id}:`, err.message);
    }
  }

  console.log(`Done. Placed: ${placed}, Failed: ${failed}`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('link-unplaced-users failed:', err);
  process.exit(1);
});
