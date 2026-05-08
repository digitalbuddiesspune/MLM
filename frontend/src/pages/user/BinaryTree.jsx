import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, useReactFlow } from 'reactflow';
import { useQuery } from '@tanstack/react-query';
import 'reactflow/dist/style.css';
import BinaryMemberNode from '../../components/binary-tree/BinaryMemberNode.jsx';
import { BinaryTreeUiContext } from '../../context/BinaryTreeUiContext.jsx';
import { getStoredUser } from '../../api/auth.js';
import {
  getBinaryDashboard,
  getBinaryGenealogy,
  findBinaryTeamMember,
  getMySponsorTree,
} from '../../api/user.js';
import { buildReactFlowBinaryElements } from '../../utils/binaryTreeLayout.js';

const NODE_TYPES = { binaryMember: BinaryMemberNode };

function FitViewHelper({ revision }) {
  const rf = useReactFlow();

  useEffect(() => {
    if (!revision) return undefined;
    const t = window.setTimeout(() => {
      rf.fitView({ padding: 0.25, duration: 420 });
    }, 40);
    return () => window.clearTimeout(t);
  }, [revision, rf]);

  return null;
}

function BinaryTreeCanvas({ nodes, edges, revision }) {
  return (
    <div className="h-[min(72vh,720px)] w-full min-h-[440px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView={false}
        minZoom={0.15}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      >
        <FitViewHelper revision={revision} />
        <Background color="#334155" gap={22} variant="dots" />
        <Controls className="!overflow-hidden !rounded-xl !border !border-slate-700/70 !bg-slate-900/95 !shadow-lg [&_button]:!fill-slate-200" />
        <MiniMap
          className="!overflow-hidden !rounded-xl !border !border-slate-700/70 !bg-slate-900/95"
          nodeStrokeWidth={2}
          maskColor="rgba(15,23,42,0.78)"
          nodeColor={() => '#10b981'}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export default function BinaryTree() {
  const stored = getStoredUser();
  const currentUserId = stored?._id ?? null;

  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [subtreeAnchor, setSubtreeAnchor] = useState(null);
  const [jumpRef, setJumpRef] = useState('');
  const [jumpHint, setJumpHint] = useState('');
  const [jumpHighlightId, setJumpHighlightId] = useState(null);
  const [depth, setDepth] = useState(10);
  const [layoutRev, setLayoutRev] = useState(0);
  const previousDepthAnchor = useRef('');

  const depthParam = depth >= 48 ? 'all' : depth;

  const toggleCollapseId = useCallback((rawId) => {
    const id = String(rawId);
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLayoutRev((x) => x + 1);
  }, []);

  const collapseHas = useCallback((id) => collapsedIds.has(String(id)), [collapsedIds]);

  const subtreeAnchorWrapped = useCallback((rawId) => {
    setSubtreeAnchor(String(rawId));
    setLayoutRev((x) => x + 1);
  }, []);

  const uiValue = useMemo(
    () => ({
      toggleCollapseId,
      collapseHas,
      setSubtreeAnchor: subtreeAnchorWrapped,
    }),
    [toggleCollapseId, collapseHas, subtreeAnchorWrapped]
  );

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

  const dashQuery = useQuery({
    queryKey: ['binary-dashboard', currentUserId],
    queryFn: getBinaryDashboard,
    select: (res) => res?.data ?? null,
    enabled: Boolean(currentUserId),
  });

  const genealogyQuery = useQuery({
    queryKey: ['binary-genealogy', jumpHighlightId, subtreeAnchor, currentUserId],
    queryFn: () =>
      getBinaryGenealogy(jumpHighlightId, {
        anchorRoot: subtreeAnchor ?? undefined,
      }),
    select: (res) => res?.data?.breadcrumb ?? [],
    enabled: Boolean(jumpHighlightId && currentUserId),
  });

  const tree = treeQuery.data;
  const error =
    treeQuery.error || dashQuery.error
      ? (treeQuery.error?.response?.data?.error ??
          dashQuery.error?.response?.data?.error ??
          'Failed to load binary data')
      : '';

  const { nodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };
    return buildReactFlowBinaryElements(tree, collapsedIds, {
      currentUserId,
      highlightId: jumpHighlightId,
    });
  }, [tree, collapsedIds, currentUserId, jumpHighlightId, layoutRev]);

  const dash = dashQuery.data;

  /** Refit when subgraph depth presets change materially */
  useEffect(() => {
    const key = `${depthParam}-${subtreeAnchor ?? ''}`;
    if (previousDepthAnchor.current && previousDepthAnchor.current !== key) {
      setLayoutRev((x) => x + 1);
    }
    previousDepthAnchor.current = key;
  }, [depthParam, subtreeAnchor]);

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
      setLayoutRev((x) => x + 1);
    } catch (e) {
      setJumpHint(e?.response?.data?.error ?? 'Member not in your subtree');
    }
  };

  const resetView = () => {
    setSubtreeAnchor(null);
    setJumpHighlightId(null);
    setJumpHint('');
    setCollapsedIds(() => new Set());
    setLayoutRev((x) => x + 1);
  };

  const revision = `${layoutRev}-${nodes?.length ?? 0}-${edges?.length ?? 0}`;

  return (
    <div className="min-h-screen space-y-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:max-w-[1600px]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Binary genealogy
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Placement uses sponsor-root BFS spillover — each parent accepts one left + one right child. Highlights show
          your position; search by referral ID to zoom the canvas.
        </p>
      </header>

      {/* Dashboard */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Total team', dash?.totals?.totalTeam ?? '—'],
          ['Left BV', dash?.totals?.leftBusinessVolume?.toLocaleString?.() ?? '0'],
          ['Right BV', dash?.totals?.rightBusinessVolume?.toLocaleString?.() ?? '0'],
          ['Matching ledger', dash?.matchingIncomeFromLedger?.toLocaleString?.() ?? '0'],
          ['Binary field', dash?.viewer?.binaryIncome?.toLocaleString?.() ?? '0'],
          ['Direct refs', dash?.viewer?.directReferrals ?? '—'],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-2xl border border-slate-800/70 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg shadow-black/30"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
            <p className="mt-1 text-xl font-semibold text-white">{v}</p>
          </div>
        ))}
      </section>

      {dash?.recentJoins?.length > 0 && (
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/75 p-4 shadow-inner shadow-black/20">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent joins</h2>
          <ul className="mt-3 divide-y divide-slate-800/80">
            {dash.recentJoins.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-medium text-slate-100">{j.name}</span>
                <span className="font-mono text-xs text-slate-400">#{j.referralNumber}</span>
                <span className="text-[11px] text-slate-500">
                  {(j.joinedAt && new Date(j.joinedAt).toLocaleDateString()) || ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 shadow-lg shadow-black/25">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col text-xs font-medium text-slate-400">
            Load depth
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {[6, 8, 10, 12, 14, 16, 20, 30, 50].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col text-xs font-medium text-slate-400">
              Search by referral ID
              <div className="mt-1 flex gap-2">
                <input
                  value={jumpRef}
                  onChange={(e) => setJumpRef(e.target.value)}
                  placeholder="e.g. 100101"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-600"
                />
                <button
                  type="button"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  onClick={handleJump}
                >
                  Jump
                </button>
              </div>
              {jumpHint ? <p className="mt-1 text-[11px] text-rose-400">{jumpHint}</p> : null}
            </label>
          </div>

          <button
            type="button"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/80"
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
              className="rounded-lg bg-violet-600/70 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500/80"
              onClick={() => {
                setSubtreeAnchor(null);
                setLayoutRev((x) => x + 1);
              }}
            >
              Back to my root
            </button>
          )}
        </div>

        {/* Breadcrumb */}
        {genealogyQuery.data?.length > 1 && jumpHighlightId && (
          <nav className="mt-4 flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
            <span className="mr-2 text-slate-500">Path</span>
            {genealogyQuery.data.map((c, i) => (
              <span key={c._id} className="flex items-center gap-1">
                {i > 0 ? <span className="text-slate-600">/</span> : null}
                <button
                  type="button"
                  className="rounded px-2 py-0.5 hover:bg-slate-800 hover:text-emerald-200"
                  onClick={() => subtreeAnchorWrapped(c._id)}
                >
                  <span className="font-semibold text-slate-100">{c.name}</span>{' '}
                  <span className="font-mono text-[10px] text-slate-500">#{c.referralNumber ?? '—'}</span>
                </button>
              </span>
            ))}
          </nav>
        )}
      </section>

      {/* Flow */}
      <section className="overflow-x-auto rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900 via-slate-950 to-black/40 p-2 shadow-2xl shadow-black/35 sm:p-4">
        {treeQuery.isLoading && (
          <div className="flex items-center justify-center py-28 text-sm text-slate-500">
            Hydrating genealogy…
          </div>
        )}
        {dashQuery.isLoading && !dash && (
          <p className="mb-4 text-center text-xs text-slate-500">Refreshing dashboard totals…</p>
        )}
        {error ? (
          <div className="rounded-xl border border-red-900/70 bg-red-950/35 px-4 py-6 text-center text-sm text-red-300">
            {typeof error === 'string' ? error : 'Something went wrong'}
          </div>
        ) : null}
        {!treeQuery.isLoading && !tree && (
          <p className="py-16 text-center text-sm text-slate-500">
            No placement data yet — register team members under your referral to populate the lattice.
          </p>
        )}
        {!treeQuery.isLoading && tree && nodes.length > 0 && (
          <div className="min-w-[760px]">
            <ReactFlowProvider>
              <BinaryTreeUiContext.Provider value={uiValue}>
                <BinaryTreeCanvas nodes={nodes} edges={edges} revision={revision} />
              </BinaryTreeUiContext.Provider>
            </ReactFlowProvider>
          </div>
        )}
      </section>
    </div>
  );
}
