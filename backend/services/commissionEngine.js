/**
 * Commission engine – processes commissions for MLM (e.g. on activation, referrals).
 * Implementation deferred; activation service calls this hook.
 */

/**
 * Process commissions when a user is activated.
 * @param {import('mongoose').Types.ObjectId} userId - Activated user's ID
 * @returns {Promise<void>}
 */
export async function processActivationCommission(userId) {
  // TODO: Implement commission logic (sponsor, levels, etc.)
  await Promise.resolve(userId);
}
