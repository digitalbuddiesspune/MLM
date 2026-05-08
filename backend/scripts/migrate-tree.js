/**
 * Tree refactor migration:
 *
 * 1) Wipes every binary-typed Ledger entry, all BinaryStats docs, and clears each user's
 *    legacy placement fields + binaryIncome/walletBalance contributions from binary credits.
 *
 * 2) Re-places every user under their actual sponsorId in createdAt order using the
 *    unidirectional MLM binary flow:
 *      fill LEFT, fill RIGHT, match pair, then continue down the active LEFT branch.
 *
 * Run: node scripts/migrate-tree.js [--dry-run]
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import Wallet from '../models/Wallet.js';
import BinaryStats from '../models/BinaryStats.js';
import { placeUserUnderSponsor } from '../services/placementService.js';

const isDryRun = process.argv.includes('--dry-run');

function log(...args) {
  console.log('[migrate-tree]', ...args);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  log('Connected. Dry-run:', isDryRun);

  const users = await User.find({}).select('_id sponsorId createdAt name binaryIncome walletBalance').sort({ createdAt: 1 }).lean();
  log(`Users found: ${users.length}`);

  /* 1) wipe old binary state */
  if (!isDryRun) {
    const binaryLedgerSum = await Ledger.aggregate([
      { $match: { type: 'binary', status: 'completed' } },
      { $group: { _id: '$userId', total: { $sum: '$amount' } } },
    ]);
    log(`Will subtract previously-credited binary from ${binaryLedgerSum.length} wallets.`);

    const ledgerDel = await Ledger.deleteMany({ type: 'binary' });
    log('Deleted binary ledger entries:', ledgerDel.deletedCount ?? 0);
    const statsDel = await BinaryStats.deleteMany({});
    log('Deleted BinaryStats docs:', statsDel.deletedCount ?? 0);

    /* roll back wallet/user.walletBalance for every user that previously got binary income */
    for (const row of binaryLedgerSum) {
      const subtract = Number(row.total ?? 0);
      if (!subtract) continue;
      await Wallet.updateOne({ userId: row._id }, { $inc: { balance: -subtract } });
      await User.findByIdAndUpdate(row._id, { $inc: { walletBalance: -subtract } });
    }

    /* clear placement state on every user */
    await User.updateMany(
      {},
      {
        $set: {
          parentId: null,
          directSponsor: null,
          leftChild: null,
          rightChild: null,
          placementSide: null,
          placementIndex: 0,
          placementSequence: 0,
          pairMatched: false,
          activePlacement: false,
          binaryStatus: 'open_left',
          placementFrozen: false,
          spilloverRedirect: null,
          binaryLeftCount: 0,
          binaryRightCount: 0,
          pairCount: 0,
          binaryIncome: 0,
          manualPlacement: false,
          placementHistory: [],
          children: [],
        },
        $unset: { position: '', leftChildId: '', rightChildId: '' },
      }
    );
    log('Cleared placement state on all users.');
  } else {
    log('(dry-run) Would wipe binary ledger, BinaryStats, and reset placement state.');
  }

  /* 2) unidirectional placement under actual sponsor in createdAt order */
  let placedCount = 0;
  let skippedCount = 0;

  for (const u of users) {
    if (!u.sponsorId) {
      skippedCount += 1;
      continue;
    }

    if (isDryRun) {
      placedCount += 1;
      continue;
    }

    try {
      const sponsor = await User.findById(u.sponsorId).select('_id').lean();
      if (!sponsor) {
        log('  skip (sponsor missing):', String(u._id));
        continue;
      }

      await placeUserUnderSponsor({
        userId: u._id,
        sponsorId: sponsor._id,
        manualPlacement: false,
        reason: 'tree-migration: unidirectional binary placement',
      });
      placedCount += 1;
    } catch (err) {
      console.error('  fail placing', String(u._id), err.message);
    }
  }
  log('Placed:', placedCount, 'Skipped (no sponsor):', skippedCount);

  await mongoose.disconnect();
  log('Done.');
}

main().catch((err) => {
  console.error('migrate-tree failed:', err);
  process.exit(1);
});
