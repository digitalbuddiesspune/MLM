/** @typedef {{ id?: string, _id?: string, children?: unknown[], placementSide?: string|null }} BinMemberLike */

/** @param {BinMemberLike | null | undefined} m */
export function normId(m) {
  return String(m?.id ?? m?._id ?? '');
}

/**
 * Preserve left/right semantics for connectors.
 * Backend usually returns `[leftChild, …]` ordering; infer from `placementSide` when mixed.
 */
export function orderedChildren(member) {
  const ch = [...(member?.children ?? [])];
  if (ch.length === 0) return [];
  const left = ch.find((c) => c?.placementSide === 'left');
  const right = ch.find((c) => c?.placementSide === 'right');
  if (left && right) return [left, right];
  if (ch.length === 1) return ch;
  return ch;
}

/** Deepest depth (root depth = 0) respecting collapsed ancestors. */
export function maxVisibleDepth(member, collapsedIds = new Set()) {
  const id = normId(member);
  if (!member || !id || collapsedIds.has(id)) return 0;
  const legs = orderedChildren(member);
  if (legs.length === 0) return 1;
  return 1 + Math.max(...legs.map((leg) => maxVisibleDepth(leg, collapsedIds)));
}

/**
 * Knuth-ish binary spread + smoothstep edges for React Flow.
 */
export function buildReactFlowBinaryElements(member, collapsedIds = new Set(), ctx = {}) {
  const nodes = [];
  const edges = [];

  const currentUserId = ctx.currentUserId ?? null;
  const highlightId = ctx.highlightId ?? null;
  const vert = Number(ctx.verticalGap ?? 150);
  const cell = Number(ctx.cell ?? 92);

  const tiers = Math.max(maxVisibleDepth(member, collapsedIds) - 1, 0);

  function walkSubtree(m, depth, xCenter) {
    if (!m) return;
    const id = normId(m);
    if (!id) return;

    nodes.push({
      id,
      type: 'binaryMember',
      position: { x: xCenter, y: depth * vert },
      data: {
        member: m,
        isYou: !!currentUserId && id === String(currentUserId),
        isFocused: !!highlightId && id === String(highlightId),
      },
    });

    if (collapsedIds.has(id)) return;

    const [left, right] = orderedChildren(m).slice(0, 2);

    const spread = tiers <= 0 ? cell : cell * Math.pow(2, Math.max(0, tiers - depth - 1));

    if (left) {
      edges.push({
        id: `${id}-L-${normId(left)}`,
        source: id,
        target: normId(left),
        animated: false,
        type: 'smoothstep',
        style: { stroke: '#34d399', strokeWidth: 2, opacity: 0.92 },
      });
      walkSubtree(left, depth + 1, xCenter - spread);
    }
    if (right) {
      edges.push({
        id: `${id}-R-${normId(right)}`,
        source: id,
        target: normId(right),
        animated: false,
        type: 'smoothstep',
        style: { stroke: '#fbbf24', strokeWidth: 2, opacity: 0.92 },
      });
      walkSubtree(right, depth + 1, xCenter + spread);
    }
  }

  walkSubtree(member, 0, 0);

  let minX = Infinity;
  let maxX = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x);
    maxX = Math.max(maxX, n.position.x);
  }
  if (Number.isFinite(minX)) {
    const mid = (minX + maxX) / 2;
    for (const n of nodes) {
      n.position.x -= mid;
    }
  }

  return { nodes, edges };
}
