import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBinaryTree } from '../../api/admin.js';
import { swapMyBinaryChildren } from '../../api/user.js';
import { getStoredUser } from '../../api/auth.js';

/** Count all loaded members in this subtree rooted at `node` (includes node). */
function subtreeMembers(node) {
  if (!node) return 0;
  return 1 + subtreeMembers(node.left) + subtreeMembers(node.right);
}

/** Loaded descendants excluding this node. */
function descendantsBelow(node) {
  if (!node || node.placeholder) return 0;
  return subtreeMembers(node.left) + subtreeMembers(node.right);
}

/** Whether rendered children connectors are expanded for `parent`. */
function showsChildrenMerged(parent, collapseBelowLevel, overrides) {
  const hasKids = !!(parent.left ?? parent.right);
  if (!hasKids) return true;
  if (parent.placeholder) return true;
  const defaulted = parent.level < collapseBelowLevel;
  return Object.prototype.hasOwnProperty.call(overrides, parent.id)
    ? overrides[parent.id]
    : defaulted;
}

/** Minimized placement node with branch toggles */
function CompactBinaryTreeNode({
  node,
  isRoot,
  isYou,
  collapseBelowLevel,
  expandOverrides,
  onToggleBranch,
  onSwapAtParent,
  swapPending,
}) {
  if (!node) return null;

  const hasLoadedChildren = !!(node.left ?? node.right);
  const showChildren =
    showsChildrenMerged(node, collapseBelowLevel, expandOverrides) && hasLoadedChildren;
  const hasLeft = node.left != null;
  const hasRight = node.right != null;
  const isPlaceholder = !!node.placeholder;
  const canSwapLegs = !isPlaceholder && hasLeft && hasRight;
  const descendants = descendantsBelow(node);

  const tip = [
    node.name,
    node.email || null,
    isPlaceholder ? 'Not loaded · raise fetch depth' : node.position ? `Side: ${node.position} · Level ${node.level}` : `Level ${node.level}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div
        title={tip}
        className={`min-w-[72px] max-w-[104px] rounded border px-1.5 py-1 text-center text-[10px] leading-tight shadow-sm ${
          isPlaceholder
            ? 'border-dashed border-slate-400 bg-slate-50 text-slate-500'
            : isRoot
              ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200'
              : node.position === 'left'
                ? 'border-l-2 border-teal-400 bg-teal-50/75 text-teal-900'
                : node.position === 'right'
                  ? 'border-l-2 border-amber-400 bg-amber-50/80 text-amber-900'
                  : 'border-slate-300 bg-white text-slate-800'
        }`}
      >
        {isYou && (
          <p className="mb-0.5 font-semibold uppercase tracking-wide text-[8px] text-indigo-600">You</p>
        )}
        <p className="truncate font-semibold">{node.name}</p>
        {!isPlaceholder && (
          <p className="mt-0.5 font-medium text-[9px] opacity-75">
            L{node.level}
            {node.position === 'left' || node.position === 'right'
              ? <span>{node.position === 'left' ? ' · L' : ' · R'}</span>
              : null}
          </p>
        )}
        {!isPlaceholder && node.matchingStatus?.bothLegsOccupied && (
          <div className="mt-1.5 space-y-0.5 rounded border border-teal-200/80 bg-teal-50/90 px-1 py-0.5 text-left text-[8px] leading-snug text-teal-950">
            <p className="font-bold uppercase tracking-wide text-teal-900">Both legs</p>
            <p className="text-teal-900">
              Pairs matched:{' '}
              <span className="font-semibold tabular-nums">{node.matchingStatus.totalMatchedPairs ?? 0}</span>
            </p>
            <p className="text-teal-900">
              Binary paid: ₹
              <span className="font-semibold tabular-nums">
                {Number(node.matchingStatus.binaryIncomePaid ?? 0).toLocaleString()}
              </span>
            </p>
            {node.matchingStatus.hasEarnedMatching ? (
              <p className="font-bold text-emerald-800">Match income credited</p>
            ) : (
              <p className="font-medium text-amber-900">Eligible — accumulate BV until pairs flush</p>
            )}
          </div>
        )}
      </div>

      {(hasLoadedChildren && !isPlaceholder) || canSwapLegs ? (
        <div className="mt-1 flex flex-col items-center gap-0.5">
          {hasLoadedChildren && !isPlaceholder && (
            <button
              type="button"
              className="max-w-[140px] rounded bg-slate-200/75 px-1 py-px text-[9px] font-medium leading-tight text-slate-700 hover:bg-slate-300/80"
              onClick={() => onToggleBranch(node)}
            >
              {showChildren
                ? descendants > 0
                  ? `Hide (${descendants} below)`
                  : 'Hide branch'
                : descendants > 0
                  ? `Show (${descendants} below)`
                  : 'Show branch'}
            </button>
          )}
          {canSwapLegs && (
            <button
              type="button"
              title="Swap this member’s left and right placement legs"
              disabled={swapPending}
              className="max-w-[140px] rounded border border-indigo-200 bg-indigo-50/90 px-1 py-px text-[9px] font-semibold leading-tight text-indigo-900 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onSwapAtParent(node.id)}
            >
              {swapPending ? '…' : 'Swap L ↔ R'}
            </button>
          )}
        </div>
      ) : null}

      {isPlaceholder && (
        <p className="mt-1 max-w-[220px] text-center text-[9px] leading-snug text-slate-500">
          Increase “Levels from server” in the toolbar to load this branch.
        </p>
      )}

      {showChildren && hasLoadedChildren && (
        <>
          <div className="h-2 w-px shrink-0 bg-slate-400/90" aria-hidden />
          <div className="w-full border-t border-slate-400/90" aria-hidden />

          <div className="flex w-full min-w-[130px] justify-between gap-1">
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="h-2 w-px shrink-0 bg-slate-400/90" aria-hidden />
              {hasLeft && (
                <CompactBinaryTreeNode
                  node={{ ...node.left, position: node.left.position ?? 'left' }}
                  isRoot={false}
                  isYou={false}
                  collapseBelowLevel={collapseBelowLevel}
                  expandOverrides={expandOverrides}
                  onToggleBranch={onToggleBranch}
                  onSwapAtParent={onSwapAtParent}
                  swapPending={swapPending}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="h-2 w-px shrink-0 bg-slate-400/90" aria-hidden />
              {hasRight && (
                <CompactBinaryTreeNode
                  node={{ ...node.right, position: node.right.position ?? 'right' }}
                  isRoot={false}
                  isYou={false}
                  collapseBelowLevel={collapseBelowLevel}
                  expandOverrides={expandOverrides}
                  onToggleBranch={onToggleBranch}
                  onSwapAtParent={onSwapAtParent}
                  swapPending={swapPending}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BinaryTree() {
  const currentUser = getStoredUser();
  const queryClient = useQueryClient();

  const [fullSubtree, setFullSubtree] = useState(false);
  const [fetchDepth, setFetchDepth] = useState(10);
  const [collapseBelowLevel, setCollapseBelowLevel] = useState(3);
  const [zoomPercent, setZoomPercent] = useState(78);
  const [expandOverrides, setExpandOverrides] = useState({});

  const loadKey = fullSubtree ? 'all' : fetchDepth;

  const { data: binaryTree, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['binaryTree', loadKey],
    queryFn: () => getBinaryTree({ maxDepth: fullSubtree ? 'all' : fetchDepth }),
    select: (res) => res?.data?.tree ?? null,
  });

  useEffect(() => {
    setExpandOverrides({});
  }, [loadKey, binaryTree?.id, collapseBelowLevel]);

  const onToggleBranch = useCallback((node) => {
    const hasKids = !!(node.left ?? node.right);
    if (!hasKids || node.placeholder) return;

    setExpandOverrides((prev) => {
      const defExpanded = node.level < collapseBelowLevel;
      const currentMerged = Object.prototype.hasOwnProperty.call(prev, node.id)
        ? prev[node.id]
        : defExpanded;
      const next = !currentMerged;
      if (next === defExpanded) {
        const rest = { ...prev };
        delete rest[node.id];
        return rest;
      }
      return { ...prev, [node.id]: next };
    });
  }, [collapseBelowLevel]);

  const swapMutation = useMutation({
    mutationFn: (parentId) => swapMyBinaryChildren({ parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binaryTree'], exact: false });
    },
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load binary tree') : '';
  const swapError = swapMutation.isError
    ? swapMutation.error?.response?.data?.error ?? 'Could not swap branches'
    : '';

  const isRootYou =
    currentUser && binaryTree && String(binaryTree.id) === String(currentUser._id);

  const totals = binaryTree ? subtreeMembers(binaryTree) : 0;
  const FETCH_PRESETS = [6, 8, 10, 12, 16, 20, 30, 40, 50];

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-900">Binary Tree</h1>
      <p className="mt-1 text-sm text-slate-600">
        Each member with{' '}
        <span className="font-semibold text-teal-800">both placement legs filled</span> shows match stats
        (pairs, ₹ credited) from your live data — so you can confirm binary matching payouts.
        Also: loads depth in bands, zoom, and branch hide/show for large trees.
        {fullSubtree
          ? ' Full-subtree fetch is enabled (can be slower with very deep placement). '
          : ` Currently loading depth ${fetchDepth}. `}
        {binaryTree ? `Members in this snapshot: ${totals}.` : null}
      </p>

      {swapError && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {swapError}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 text-[11px] text-slate-700">
          <label className="flex flex-col gap-1 font-medium">
            <span className="text-slate-500">Levels from server</span>
            <select
              value={fetchDepth}
              disabled={fullSubtree}
              onChange={(e) => setFetchDepth(Number(e.target.value))}
              className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
            >
              {FETCH_PRESETS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={fullSubtree}
              onChange={(e) => setFullSubtree(e.target.checked)}
              className="rounded border-slate-400"
            />
            <span className="text-slate-600">
              Full tree <span className="font-normal text-slate-500">(heavy if very deep)</span>
            </span>
          </label>

          <label className="flex flex-col gap-1 font-medium">
            <span className="max-w-[200px] text-slate-500">
              Starting layout: branches open until parent reaches level ≥
            </span>
            <select
              value={collapseBelowLevel}
              onChange={(e) => setCollapseBelowLevel(Number(e.target.value))}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{`Collapse from parent level ≥ ${n}`}</option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[140px] flex-col gap-1 font-medium">
            <span className="text-slate-500">Zoom {zoomPercent}%</span>
            <input
              type="range"
              min={45}
              max={100}
              value={zoomPercent}
              onChange={(e) => setZoomPercent(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 font-medium hover:bg-slate-50"
            onClick={() => setExpandOverrides({})}
          >
            Reset branches
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-3 shadow-sm sm:p-4">
        {loading && <p className="py-8 text-center text-xs text-slate-500">Loading binary tree…</p>}
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
        {!loading && !error && !binaryTree && (
          <p className="py-8 text-center text-xs text-slate-500">
            No placement yet. You are the root; new members will be placed under you.
          </p>
        )}
        {!loading && !error && binaryTree && (
          <div>
            <p className="mb-3 text-center text-[11px] text-slate-500">
              Use <span className="font-semibold text-indigo-800">Swap L ↔ R</span> under any member who has both legs — only your placement tree allows this.
            </p>

            <div className="max-h-[min(78vh,900px)] overflow-auto rounded-lg border border-slate-200/70 bg-white/60 p-4">
              <div
                className="flex origin-top justify-start pb-28 pl-2 pt-4 sm:justify-center"
                style={{ transform: `scale(${zoomPercent / 100})` }}
              >
                <CompactBinaryTreeNode
                  node={binaryTree}
                  isRoot={true}
                  isYou={isRootYou}
                  collapseBelowLevel={collapseBelowLevel}
                  expandOverrides={expandOverrides}
                  onToggleBranch={onToggleBranch}
                  onSwapAtParent={(id) => swapMutation.mutate(id)}
                  swapPending={swapMutation.isPending}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
