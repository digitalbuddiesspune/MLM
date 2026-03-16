import cron from 'node-cron';
import User from '../models/User.js';

/** Cron: daily at 00:00 (midnight) */
const RENEWAL_CRON_SCHEDULE = '0 0 * * *';

/**
 * Deactivates users whose renewalDate is before today.
 * Sets isActive = false; does not delete.
 * @returns {Promise<{ deactivated: number }>}
 */
export async function runRenewalCheck() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await User.updateMany(
    { renewalDate: { $lt: today }, isActive: true },
    { $set: { isActive: false } }
  );

  const deactivated = result.modifiedCount ?? 0;
  if (deactivated > 0) {
    console.log(`[RenewalJob] Deactivated ${deactivated} user(s) past renewal date`);
  }

  return { deactivated };
}

/**
 * Schedules the renewal check to run daily at midnight.
 * Call after DB is connected.
 */
export function startRenewalJob() {
  cron.schedule(RENEWAL_CRON_SCHEDULE, async () => {
    try {
      await runRenewalCheck();
    } catch (error) {
      console.error('[RenewalJob] Error:', error.message);
    }
  });
  console.log('[RenewalJob] Scheduled daily at 00:00');
}
