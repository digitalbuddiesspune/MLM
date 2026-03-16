import cron from 'node-cron';
import Ledger from '../models/Ledger.js';
import PayoutRun from '../models/PayoutRun.js';

/** Cron: daily at 00:00 on days 1–5 of each month */
const PAYOUT_CRON_SCHEDULE = '0 0 1-5 * *';

/**
 * Returns the previous calendar month's year and month.
 * @returns {{ year: number, month: number }}
 */
function getPreviousMonth() {
  const d = new Date();
  d.setDate(0); // last day of previous month
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * Returns start and end of a calendar month (start inclusive, end exclusive).
 * @param {number} year
 * @param {number} month
 * @returns {{ start: Date, end: Date }}
 */
function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

/**
 * Generates payout report for ledger entries: summary and breakdown by user.
 * @param {Array<{ userId: any, type: string, amount: number, createdAt: Date, _id: any }>} entries
 * @returns {{ summary: { entryCount: number, totalAmount: number }, byUser: Array<{ userId: any, entryCount: number, totalAmount: number }> }}
 */
function generatePayoutReport(entries) {
  const byUser = new Map();

  for (const e of entries) {
    const key = e.userId?.toString?.() ?? e.userId;
    if (!byUser.has(key)) {
      byUser.set(key, { userId: e.userId, entryCount: 0, totalAmount: 0 });
    }
    const row = byUser.get(key);
    row.entryCount += 1;
    row.totalAmount += e.amount;
  }

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  return {
    summary: {
      entryCount: entries.length,
      totalAmount,
    },
    byUser: Array.from(byUser.values()),
  };
}

/**
 * Runs monthly payout for the previous calendar month: generates report,
 * marks ledger entries as processed, and locks the month.
 * Skips if the month is already locked.
 * @returns {Promise<{ skipped: boolean, run?: import('../models/PayoutRun.js').default, report?: Object }>}
 */
export async function runPayoutJob() {
  const { year, month } = getPreviousMonth();
  const existing = await PayoutRun.findOne({ year, month }).lean();

  if (existing) {
    return { skipped: true, reason: 'Month already locked' };
  }

  const { start, end } = getMonthRange(year, month);

  const entries = await Ledger.find({
    createdAt: { $gte: start, $lt: end },
    status: 'completed',
    payoutRunId: null,
  })
    .select('userId type amount createdAt')
    .lean();

  const run = await PayoutRun.create([
    {
      year,
      month,
      status: 'running',
      entryCount: 0,
      totalAmount: 0,
    },
  ]).then((r) => r[0]);

  const report = generatePayoutReport(entries);
  const entryIds = entries.map((e) => e._id);

  await Ledger.updateMany(
    { _id: { $in: entryIds } },
    { $set: { payoutRunId: run._id } }
  );

  await PayoutRun.findByIdAndUpdate(run._id, {
    $set: {
      status: 'completed',
      entryCount: report.summary.entryCount,
      totalAmount: report.summary.totalAmount,
      report,
    },
  });

  console.log(
    `[PayoutJob] ${year}-${String(month).padStart(2, '0')}: ${report.summary.entryCount} entries, total ${report.summary.totalAmount}`
  );

  return {
    skipped: false,
    run: await PayoutRun.findById(run._id).lean(),
    report,
  };
}

/**
 * Schedules the payout job to run at midnight on days 1–5 of each month.
 * Call after DB is connected.
 */
export function startPayoutJob() {
  cron.schedule(PAYOUT_CRON_SCHEDULE, async () => {
    try {
      await runPayoutJob();
    } catch (error) {
      console.error('[PayoutJob] Error:', error.message);
    }
  });
  console.log('[PayoutJob] Scheduled monthly (days 1–5 at 00:00)');
}
