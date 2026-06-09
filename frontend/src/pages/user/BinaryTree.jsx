import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredUser } from '../../api/auth.js';
import {
  getUnplacedUsers,
  getOpenPlacementSlots as getAdminOpenPlacementSlots,
  placeTreeUser,
} from '../../api/admin.js';
import {
  findBinaryTeamMember,
  getMySponsorTree,
  getMyTeam,
  getOpenPlacementSlots,
  placeMyReferralInTree,
} from '../../api/user.js';

function slotKey(parentId, side) {
  return `${parentId}:${side}`;
}

function treeMaxDepth(node, depth = 0) {
  if (!node) return depth;
  const kids = node.children ?? [];
  if (kids.length === 0) return depth;
  return Math.max(...kids.map((child) => treeMaxDepth(child, depth + 1)));
}

function OpenSlotButton({ side, onPlace, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPlace}
      className="min-w-[120px] rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 px-3 py-4 text-center text-xs font-semibold text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100 disabled:opacity-60"
    >
      + Place {side}
    </button>
  );
}

function TreeNode({
  node,
  level = 0,
  maxVisibleLevel = 3,
  highlightedId = null,
  collapsedLevels,
  collapsedNodeIds,
  onToggleNodeCollapse,
  placementMode = false,
  openSlotKeys = null,
  onPlaceSlot = null,
  placing = false,
}) {
  if (!node) return null;
  const nodeId = String(node.id);
  const isHighlighted = highlightedId && String(highlightedId) === String(node.id);
  const childList = node.children ?? [];
  const leftChild = node.leftChild
    ? childList.find((c) => String(c.id) === String(node.leftChild))
    : null;
  const rightChild = node.rightChild
    ? childList.find((c) => String(c.id) === String(node.rightChild))
    : null;
  const hasDescendants = Boolean(leftChild || rightChild || !node.leftChild || !node.rightChild);
  const isNodeCollapsed = collapsedNodeIds.has(nodeId);
  const isLevelCollapsed = collapsedLevels.has(level);
  const showLegs =
    hasDescendants &&
    !isNodeCollapsed &&
    !isLevelCollapsed &&
    level < maxVisibleLevel;

  const renderLeg = (side, child) => {
    const key = slotKey(nodeId, side);
    const isOpen = placementMode && openSlotKeys?.has(key) && !child;

    return (
      <div className="flex min-w-[120px] flex-col items-center">
        <div className="h-4 w-px bg-slate-300" />
        {child ? (
          <TreeNode
            node={child}
            level={level + 1}
            maxVisibleLevel={maxVisibleLevel}
            highlightedId={highlightedId}
            collapsedLevels={collapsedLevels}
            collapsedNodeIds={collapsedNodeIds}
            onToggleNodeCollapse={onToggleNodeCollapse}
            placementMode={placementMode}
            openSlotKeys={openSlotKeys}
            onPlaceSlot={onPlaceSlot}
            placing={placing}
          />
        ) : isOpen ? (
          <OpenSlotButton
            side={side}
            disabled={placing}
            onPlace={() => onPlaceSlot?.(nodeId, side)}
          />
        ) : (
          <div className="min-w-[120px] rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[10px] text-slate-400">
            Empty {side}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative min-w-[120px] rounded-lg border px-3 py-2 text-center shadow-sm ${
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
        {hasDescendants ? (
          <button
            type="button"
            onClick={() => onToggleNodeCollapse(nodeId)}
            className="mt-2 rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
            aria-expanded={!isNodeCollapsed}
          >
            {isNodeCollapsed ? 'Expand' : 'Collapse'}
          </button>
        ) : null}
      </div>

      {showLegs && (
        <>
          <div className="h-5 w-px bg-slate-300" />
          <div className="w-full border-t border-slate-300" />
          <div className="mt-2 flex items-start justify-center gap-8">
            {renderLeg('left', leftChild)}
            {renderLeg('right', rightChild)}
          </div>
        </>
      )}
    </div>
  );
}

export default function BinaryTree() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isAdminView = location.pathname.startsWith('/admin');
  const stored = getStoredUser();
  const currentUserId = stored?._id ?? null;
  const userPlaceUserId = !isAdminView ? (searchParams.get('placeUserId') ?? '') : '';
  const [adminPlaceUserId, setAdminPlaceUserId] = useState('');
  const placeUserId = isAdminView ? adminPlaceUserId : userPlaceUserId;
  const [placeMessage, setPlaceMessage] = useState('');

  const [subtreeAnchor, setSubtreeAnchor] = useState(null);
  const [jumpRef, setJumpRef] = useState('');
  const [jumpHint, setJumpHint] = useState('');
  const [jumpHighlightId, setJumpHighlightId] = useState(null);
  const [depth, setDepth] = useState(12);
  const [visibleLevels, setVisibleLevels] = useState(4);
  const [collapsedLevels, setCollapsedLevels] = useState(() => new Set());
  const [collapsedNodeIds, setCollapsedNodeIds] = useState(() => new Set());

  const effectiveDepth = isAdminView ? 12 : depth;
  const effectiveVisibleLevels = isAdminView ? 12 : visibleLevels;
  const depthParam = effectiveDepth >= 48 ? 'all' : effectiveDepth;

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
  const maxTreeDepth = useMemo(() => (tree ? treeMaxDepth(tree) : 0), [tree]);
  const levelCount = maxTreeDepth + 1;

  const teamQuery = useQuery({
    queryKey: ['user-dashboard', 'team'],
    queryFn: getMyTeam,
    enabled: Boolean(placeUserId) && !isAdminView,
  });

  const unplacedQuery = useQuery({
    queryKey: ['tree-unplaced-users'],
    queryFn: getUnplacedUsers,
    enabled: isAdminView,
  });

  const openSlotsQuery = useQuery({
    queryKey: ['tree-open-slots', currentUserId, isAdminView],
    queryFn: () =>
      isAdminView
        ? getAdminOpenPlacementSlots(currentUserId)
        : getOpenPlacementSlots(currentUserId),
    enabled: Boolean(placeUserId) && Boolean(currentUserId),
  });

  const unplacedUsers = unplacedQuery.data?.data?.users ?? [];

  const placeMember = useMemo(() => {
    if (isAdminView) {
      return unplacedUsers.find((u) => String(u._id) === String(placeUserId));
    }
    return (teamQuery.data?.data?.users ?? []).find((u) => String(u._id) === String(placeUserId));
  }, [isAdminView, unplacedUsers, teamQuery.data, placeUserId]);

  const openSlotKeys = useMemo(() => {
    const keys = new Set();
    for (const slot of openSlotsQuery.data?.data?.slots ?? []) {
      keys.add(slotKey(slot.parentId, slot.side));
    }
    return keys;
  }, [openSlotsQuery.data]);

  const placeMutation = useMutation({
    mutationFn: ({ parentId, side }) => {
      const sponsorId = isAdminView
        ? (placeMember?.sponsorId?._id ?? placeMember?.sponsorId)
        : currentUserId;
      const payload = {
        userId: placeUserId,
        sponsorId,
        parentId,
        side,
      };
      return isAdminView ? placeTreeUser(payload) : placeMyReferralInTree(payload);
    },
    onSuccess: () => {
      setPlaceMessage('Member placed successfully.');
      queryClient.invalidateQueries({ queryKey: ['binary-tree-flow'] });
      queryClient.invalidateQueries({ queryKey: ['tree-open-slots'] });
      queryClient.invalidateQueries({ queryKey: ['tree-unplaced-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard', 'team'] });
      if (isAdminView) {
        setAdminPlaceUserId('');
      } else {
        navigate('/user/binary-tree', { replace: true });
      }
    },
    onError: (err) => {
      setPlaceMessage(err?.response?.data?.error ?? 'Placement failed');
    },
  });

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
    setCollapsedLevels(new Set());
    setCollapsedNodeIds(new Set());
  };

  const toggleLevelCollapse = (levelIndex) => {
    setCollapsedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelIndex)) next.delete(levelIndex);
      else next.add(levelIndex);
      return next;
    });
  };

  const toggleNodeCollapse = (nodeId) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      const key = String(nodeId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAllLevels = () => {
    setCollapsedLevels(new Set());
    setCollapsedNodeIds(new Set());
  };

  return (
    <div className="min-h-screen space-y-5 px-4 py-6 sm:px-6 lg:max-w-[1500px]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Binary Tree
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          {isAdminView
            ? 'Centralized platform binary tree. The admin account is the root sponsor; every registered member is linked under this tree.'
            : 'Simple sponsor hierarchy view. Example structure: A root with left/right branches (B/C), then D/E/F/G and so on.'}
        </p>
      </header>

      {/* Toolbar — user view only */}
      {!isAdminView && (
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
      )}

      {isAdminView && (
        <section className="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Place new members</h2>
          <p className="mt-1 text-xs text-slate-600">
            Select an unplaced user, then click an open <span className="font-medium">+ Place left/right</span> slot on the tree below.
          </p>

          {placeMessage ? (
            <p className={`mt-3 rounded-md px-3 py-2 text-xs ${placeMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {placeMessage}
            </p>
          ) : null}

          {unplacedQuery.isLoading ? (
            <p className="mt-3 text-sm text-slate-500">Loading unplaced users…</p>
          ) : unplacedUsers.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No unplaced users. Everyone is already in the tree.</p>
          ) : (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="min-w-[260px] flex-1 text-xs font-medium text-slate-600">
                Member to place
                <select
                  value={adminPlaceUserId}
                  onChange={(e) => {
                    setAdminPlaceUserId(e.target.value);
                    setPlaceMessage('');
                  }}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Select user…</option>
                  {unplacedUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} (ID {u.referralNumber ?? '—'})
                      {u.sponsor?.name ? ` — sponsor: ${u.sponsor.name}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              {adminPlaceUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminPlaceUserId('');
                    setPlaceMessage('');
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {placeUserId && placeMember ? (
            <p className="mt-3 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
              Placing <span className="font-semibold">{placeMember.name}</span>
              {placeMember.sponsor?.name ? (
                <> (registered under <span className="font-semibold">{placeMember.sponsor.name}</span>)</>
              ) : null}
              {' '}— pick a slot on the tree.
            </p>
          ) : null}
        </section>
      )}

      {placeUserId && !isAdminView && (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-900">Choose placement slot</p>
              <p className="mt-1 text-xs text-indigo-800">
                Placing{' '}
                <span className="font-medium">{placeMember?.name ?? 'member'}</span>
                {' '}— click an open <span className="font-medium">+ Place left/right</span> slot on the tree below.
              </p>
              {placeMessage ? (
                <p className={`mt-2 text-xs ${placeMessage.includes('successfully') ? 'text-green-700' : 'text-red-700'}`}>
                  {placeMessage}
                </p>
              ) : null}
            </div>
            <Link
              to="/user/dashboard"
              className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
            >
              ← Back to dashboard
            </Link>
          </div>
        </section>
      )}

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
            {isAdminView
              ? 'No binary tree data yet. Register members with the admin referral code to build the centralized tree.'
              : 'No placement data yet. Register team members using your referral code.'}
          </p>
        )}
        {!treeQuery.isLoading && tree && (
          <div className="min-w-[760px] p-4">
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
              <span className="text-xs font-medium text-slate-500">Collapse by level:</span>
              {Array.from({ length: levelCount }, (_, levelIndex) => {
                const isCollapsed = collapsedLevels.has(levelIndex);
                return (
                  <button
                    key={levelIndex}
                    type="button"
                    onClick={() => toggleLevelCollapse(levelIndex)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      isCollapsed
                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    aria-expanded={!isCollapsed}
                  >
                    Level {levelIndex + 1}
                    <span className="ml-1">{isCollapsed ? '▸' : '▾'}</span>
                  </button>
                );
              })}
              {(collapsedLevels.size > 0 || collapsedNodeIds.size > 0) && (
                <button
                  type="button"
                  onClick={expandAllLevels}
                  className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                >
                  Expand all
                </button>
              )}
            </div>
            <TreeNode
              node={tree}
              level={0}
              maxVisibleLevel={effectiveVisibleLevels}
              highlightedId={jumpHighlightId}
              collapsedLevels={collapsedLevels}
              collapsedNodeIds={collapsedNodeIds}
              onToggleNodeCollapse={toggleNodeCollapse}
              placementMode={Boolean(placeUserId) && (isAdminView ? Boolean(placeMember) : true)}
              openSlotKeys={openSlotKeys}
              placing={placeMutation.isPending}
              onPlaceSlot={(parentId, side) => {
                setPlaceMessage('');
                placeMutation.mutate({ parentId, side });
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
