/**
 * Human label for binary BV matching credits (left leg + right leg).
 * @param {{ type?: string, amount?: number, metadata?: { binaryMatchLegs?: number[] } }} txn
 * @returns {string | null}
 */
export function formatBinaryMatchingDetail(txn) {
  if (!txn || txn.type !== 'binary') return null;

  const legs = txn.metadata?.binaryMatchLegs;
  if (Array.isArray(legs) && legs.length === 2 && legs.every((n) => Number.isFinite(Number(n)))) {
    const [l, r] = legs.map((n) => Number(n));
    return `+₹${l.toLocaleString()} + ₹${r.toLocaleString()}`;
  }

  return null;
}
