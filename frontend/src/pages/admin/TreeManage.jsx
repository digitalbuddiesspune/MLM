import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredUser } from '../../api/auth.js';
import {
  dragDropTreeUser,
  getTreeById,
  manualPlaceTreeUser,
} from '../../api/admin.js';
import {
  highlightSponsor,
  selectNode,
  setAutoPlacementEnabled,
  setManualMode,
} from '../../store/treeManagementSlice.js';

const X_GAP = 220;
const Y_GAP = 132;

function flattenTree(root) {
  const nodes = [];
  const edges = [];
  const levelRows = new Map();

  function visit(node, depth = 0, parentId = null) {
    if (!node) return;
    const row = levelRows.get(depth) ?? 0;
    levelRows.set(depth, row + 1);

    nodes.push({
      id: node.id,
      type: 'default',
      position: { x: depth * X_GAP, y: row * Y_GAP },
      data: {
        ...node,
        label: (
          <div className="min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-bold text-slate-900">{node.name}</p>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  node.placementSide === 'right'
                    ? 'bg-amber-100 text-amber-800'
                    : node.placementSide === 'left'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {node.placementSide ?? 'root'}
              </span>
            </div>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              #{node.referralNumber ?? '—'} · idx {node.placementIndex ?? 0}
            </p>
            <p className={`mt-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
              node.pairMatched
                ? 'bg-emerald-100 text-emerald-800'
                : node.activePlacement
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-slate-100 text-slate-600'
            }`}>
              {node.binaryStatus ?? 'open'}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
              <span className="rounded bg-teal-50 px-1 py-0.5 text-teal-800">L {node.binaryLeftCount ?? 0}</span>
              <span className="rounded bg-amber-50 px-1 py-0.5 text-amber-800">R {node.binaryRightCount ?? 0}</span>
              <span className="rounded bg-indigo-50 px-1 py-0.5 text-indigo-800">P {node.pairCount ?? 0}</span>
            </div>
          </div>
        ),
      },
      draggable: true,
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        animated: true,
        type: 'smoothstep',
        label: node.placementSide ?? '',
        style: { stroke: node.placementSide === 'right' ? '#d97706' : '#0f766e' },
      });
    }

    for (const child of node.children ?? []) {
      visit(child, depth + 1, node.id);
    }
  }

  visit(root);
  return { nodes, edges };
}

function nearestSponsor(node, nodes) {
  if (!node) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const candidate of nodes) {
    if (candidate.id === node.id) continue;
    const dx = candidate.position.x - node.position.x;
    const dy = candidate.position.y - node.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return bestDistance <= 260 ? best : null;
}

export default function AdminTreeManage() {
  const user = getStoredUser();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { selectedNodeId, highlightedSponsorId, manualMode, autoPlacementEnabled } = useSelector(
    (state) => state.treeManagement
  );

  const [rootId, setRootId] = useState(user?._id ?? '');
  const [rootDraft, setRootDraft] = useState(user?._id ?? '');
  const [sideDraft, setSideDraft] = useState('left');
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-tree-manage', rootId],
    queryFn: () => getTreeById(rootId, { maxDepth: 8 }),
    enabled: Boolean(rootId),
    select: (res) => res?.data?.tree ?? null,
  });

  const graph = useMemo(() => flattenTree(data), [data]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setEdges, setNodes]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-tree-manage'] });

  const dragDropMutation = useMutation({
    mutationFn: dragDropTreeUser,
    onSuccess: (res) => {
      setStatus(`Moved successfully. New sponsor pairs delta: ${res?.data?.newSponsor?.deltaPairs ?? 0}`);
      refresh();
    },
    onError: (err) => {
      setStatus(err?.response?.data?.error ?? 'Drag-drop failed');
    },
  });

  const sideMutation = useMutation({
    mutationFn: manualPlaceTreeUser,
    onSuccess: () => {
      setStatus('Placement side updated.');
      refresh();
    },
    onError: (err) => {
      setStatus(err?.response?.data?.error ?? 'Side update failed');
    },
  });

  const onNodeClick = useCallback((_, node) => {
    dispatch(selectNode(node.id));
    setSideDraft(node.data?.placementSide === 'right' ? 'right' : 'left');
  }, [dispatch]);

  const onNodeDrag = useCallback((_, node) => {
    const sponsor = nearestSponsor(node, nodes);
    dispatch(highlightSponsor(sponsor?.id ?? null));
  }, [dispatch, nodes]);

  const onNodeDragStop = useCallback((_, node) => {
    const sponsor = nearestSponsor(node, nodes);
    dispatch(highlightSponsor(null));
    if (!sponsor) {
      setStatus('Drop closer to a sponsor node to re-parent.');
      return;
    }
    dragDropMutation.mutate({
      userId: node.id,
      newSponsorId: sponsor.id,
      newSide: sideDraft,
      reason: 'ReactFlow drag-drop',
    });
  }, [dispatch, dragDropMutation, nodes, sideDraft]);

  const decoratedNodes = nodes.map((node) => ({
    ...node,
    style: {
      border: node.id === selectedNodeId ? '2px solid #4f46e5' : undefined,
      boxShadow: node.id === highlightedSponsorId
        ? '0 0 0 4px rgba(20,184,166,.32)'
        : node.data?.activePlacement
          ? '0 0 0 3px rgba(99,102,241,.22)'
          : undefined,
      borderRadius: 12,
    },
  }));

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sponsor Tree Manager</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Unidirectional binary flow: fill LEFT, fill RIGHT, match the pair, then continue
            down the active placement branch. Drag a member near another node to override the path.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={rootDraft}
            onChange={(e) => setRootDraft(e.target.value)}
            className="min-w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-xs"
            placeholder="Root user Mongo ID"
          />
          <button
            type="button"
            onClick={() => setRootId(rootDraft.trim())}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Load Tree
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="h-[72vh] min-h-[560px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading && <p className="p-4 text-sm text-slate-500">Loading tree...</p>}
          {error && <p className="p-4 text-sm text-red-600">{error?.response?.data?.error ?? 'Failed to load tree'}</p>}
          {!isLoading && !error && (
            <ReactFlow
              nodes={decoratedNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              fitView
            >
              <MiniMap pannable zoomable />
              <Controls />
              <Background gap={16} />
            </ReactFlow>
          )}
        </div>

        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Admin Controls</h2>
            <p className="mt-1 text-xs text-slate-500">
              Manual mode is enabled by default. Auto placement toggle is stored for admin workflow control.
            </p>
          </div>

          <label className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            Manual placement mode
            <input
              type="checkbox"
              checked={manualMode}
              onChange={(e) => dispatch(setManualMode(e.target.checked))}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            Auto placement toggle
            <input
              type="checkbox"
              checked={autoPlacementEnabled}
              onChange={(e) => dispatch(setAutoPlacementEnabled(e.target.checked))}
            />
          </label>

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-800">Selected Node</p>
            <p className="mt-1 break-all text-xs text-slate-500">{selectedNode?.id ?? 'Click a node'}</p>
            <label className="mt-3 block text-xs font-semibold text-slate-700">
              Assign side
              <select
                value={sideDraft}
                onChange={(e) => setSideDraft(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-xs"
              >
                <option value="left">LEFT</option>
                <option value="right">RIGHT</option>
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedNodeId || sideMutation.isPending}
              onClick={() => sideMutation.mutate({ userId: selectedNodeId, side: sideDraft })}
              className="mt-3 w-full rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sideMutation.isPending ? 'Saving...' : 'Save Side Override'}
            </button>
          </div>

          <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-900">
            <p className="font-bold">Live placement preview</p>
            <p className="mt-1 break-all">
              Drop target: {highlightedSponsorId ?? 'drag near a sponsor'}
            </p>
          </div>

          {status && (
            <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white" role="status">
              {status}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
