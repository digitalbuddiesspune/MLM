import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStoredUser } from '../../api/auth.js';
import {
  findBinaryTeamMember,
  getMySponsorTree,
} from '../../api/user.js';

function TreeNode({ node, level = 0, maxVisibleLevel = 3, highlightedId = null }) {
  if (!node) return null;
  const isHighlighted = highlightedId && String(highlightedId) === String(node.id);
  const isVisible = level < maxVisibleLevel;
  const children = isVisible ? (node.children ?? []) : [];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`min-w-[120px] rounded-lg border px-3 py-2 text-center shadow-sm ${
          level === 0
            ? 'border-blue-300 bg-blue-50'
            : isHighlighted
              ? 'border-violet-300 bg-violet-50'
              : 'border-slate-200 bg-white'
        }`}
      >
        <p className="truncate text-sm font-semibold text-slate-900">{node.name ?? '—'}</p>
        <p className="mt-0.5 text-[11px] font-mono text-slate-500">ID {node.referralNumber ?? '—'}</p>
        <p className="mt-1 text-[10px] uppercase text-slate-500">
          {level === 0 ? 'Root / Sponsor' : (node.placementSide ?? 'Node')}
        </p>
      </div>

      {children.length > 0 && (
        <>
          <div className="h-5 w-px bg-slate-300" />
          <div className="w-full border-t border-slate-300" />
          <div className="mt-2 flex items-start justify-center gap-4">
            {children.map((child) => (
              <div key={child.id} className="flex min-w-[120px] flex-col items-center">
                <div className="h-4 w-px bg-slate-300" />
                <TreeNode
                  node={child}
                  level={level + 1}
                  maxVisibleLevel={maxVisibleLevel}
                  highlightedId={highlightedId}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function BinaryTree() {
  const stored = getStoredUser();
  const currentUserId = stored?._id ?? null;

  const [subtreeAnchor, setSubtreeAnchor] = useState(null);
  const [jumpRef, setJumpRef] = useState('');
  const [jumpHint, setJumpHint] = useState('');
  const [jumpHighlightId, setJumpHighlightId] = useState(null);
  const [depth, setDepth] = useState(12);
  const [visibleLevels, setVisibleLevels] = useState(4);

  const depthParam = depth >= 48 ? 'all' : depth;

  const treeQuery = useQuery({
    queryKey: ['binary-tree-flow', currentUserId, subtreeAnchor, depthParam],
    queryFn: () =>
      getMySponsorTree({
        maxDepth: depthParam,
        rootId: subtreeAnchor ?? undefined,
      }),
    select: (res) => res?.data?.tree ?? null,
    enabled: Boolean(currentUserId),
  });

  const tree = treeQuery.data;
  const error = treeQuery.error
    ? (treeQuery.error?.response?.data?.error ?? 'Failed to load binary data')
    : '';

  const handleJump = async () => {
    const trimmed = jumpRef.trim();
    if (!/^\d+$/.test(trimmed)) {
      setJumpHint('Enter numeric referral ID only.');
      return;
    }
    setJumpHint('');
    try {
      const res = await findBinaryTeamMember(Number(trimmed));
      const hitId = res?.data?.id;
      if (!hitId) return;
      setJumpHighlightId(String(hitId));
    } catch (e) {
      setJumpHint(e?.response?.data?.error ?? 'Member not in your subtree');
    }
  };

  const resetView = () => {
    setSubtreeAnchor(null);
    setJumpHighlightId(null);
    setJumpHint('');
    setVisibleLevels(4);
  };

  return (
    <div className="min-h-screen space-y-5 px-4 py-6 sm:px-6 lg:max-w-[1500px]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Binary Tree
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          Simple sponsor hierarchy view. Example structure: A root with left/right branches (B/C), then D/E/F/G and so on.
        </p>
      </header>

      {/* Toolbar */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col text-xs font-medium text-slate-600">
            Fetch depth
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {[6, 8, 10, 12, 14, 16, 20, 30, 50].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-medium text-slate-600">
            Visible levels
            <select
              value={visibleLevels}
              onChange={(e) => setVisibleLevels(Number(e.target.value))}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col text-xs font-medium text-slate-600">
              Search by referral ID
              <div className="mt-1 flex gap-2">
                <input
                  value={jumpRef}
                  onChange={(e) => setJumpRef(e.target.value)}
                  placeholder="e.g. 100101"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  onClick={handleJump}
                >
                  Jump
                </button>
              </div>
              {jumpHint ? <p className="mt-1 text-[11px] text-rose-600">{jumpHint}</p> : null}
            </label>
          </div>

          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => {
              resetView();
              setJumpRef('');
            }}
          >
            Reset view
          </button>
          {subtreeAnchor && (
            <button
              type="button"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
              onClick={() => {
                setSubtreeAnchor(null);
              }}
            >
              Back to my root
            </button>
          )}
        </div>
      </section>

      {/* Flow */}
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-4">
        {treeQuery.isLoading && (
          <div className="flex items-center justify-center py-28 text-sm text-slate-500">
            Loading tree...
          </div>
        )}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
            {typeof error === 'string' ? error : 'Something went wrong'}
          </div>
        ) : null}
        {!treeQuery.isLoading && !tree && (
          <p className="py-16 text-center text-sm text-slate-500">
            No placement data yet. Register team members using your referral code.
          </p>
        )}
        {!treeQuery.isLoading && tree && (
          <div className="min-w-[760px] p-4">
            <TreeNode
              node={tree}
              level={0}
              maxVisibleLevel={visibleLevels}
              highlightedId={jumpHighlightId}
            />
          </div>
        )}
      </section>
    </div>
  );
}
