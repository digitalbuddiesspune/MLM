/**
 * Legacy BV-based binary income engine — REMOVED in the unidirectional binary-flow refactor.
 *
 * Binary income is now driven by the placement engine in `placementService.js`:
 *   a node matches exactly one pair when both LEFT and RIGHT placement legs are filled.
 *
 * The exports below stay so legacy callers don't crash on import; they no-op.
 */
export const BINARY_MATCH_AMOUNT_PER_LEG = 75;
export const BINARY_MATCH_TOTAL_PER_PAIR = 150;
export const FIXED_MATCHING_AMOUNT = 150;

/**
 * @deprecated Sponsor-centric pair credits happen automatically inside
 * `placementService.placeUserUnderSponsor` and `dragDropService.moveNode`.
 */
export async function processBinaryIncome() {
  return { processedUplines: 0, deprecated: true };
}
