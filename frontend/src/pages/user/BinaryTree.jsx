import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBinaryTree } from '../../api/admin.js';
import { getStoredUser } from '../../api/auth.js';

/** Binary placement tree node (left/right from DB). You are root; children are your placement subtree. Commission is by level. */
function BinaryTreeNode({ node, isRoot, isYou }) {
  if (!node) return null;

  const hasLeft = node.left != null;
  const hasRight = node.right != null;
  const hasChildren = hasLeft || hasRight;

  return (
    <div className="flex flex-col items-center shrink-0">
      <div
        className={`rounded border px-2 py-1.5 text-center min-w-[100px] max-w-[120px] shadow-sm ${
          isRoot
            ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200'
            : node.position === 'left'
              ? 'border-teal-400 bg-teal-50/80 text-teal-900 border-l-2'
              : 'border-amber-400 bg-amber-50/80 text-amber-900 border-l-2'
        }`}
      >
        {isYou && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 mb-0.5">You (parent)</p>
        )}
        <p className="text-xs font-medium truncate" title={node.name}>{node.name}</p>
        {node.email && (
          <p className="text-xs opacity-90 truncate mt-0.5 text-slate-600" title={node.email}>{node.email}</p>
        )}
        <p className="text-xs mt-1 font-medium opacity-80">
          L{node.level}
          {(node.position === 'left' || node.position === 'right') && (
            <span className="ml-0.5">· {node.position === 'left' ? 'L' : 'R'}</span>
          )}
        </p>
      </div>

      {hasChildren && (
        <>
          <div className="w-0.5 h-3 bg-slate-400 shrink-0" aria-hidden />
          <div className="w-full min-w-[200px] border-t border-slate-400" style={{ minHeight: 1 }} aria-hidden />
          <div className="flex w-full min-w-[200px] justify-between gap-4">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-0.5 h-3 bg-slate-400 shrink-0" aria-hidden />
              {hasLeft && <BinaryTreeNode node={{ ...node.left, position: 'left' }} isRoot={false} isYou={false} />}
            </div>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-0.5 h-3 bg-slate-400 shrink-0" aria-hidden />
              {hasRight && <BinaryTreeNode node={{ ...node.right, position: 'right' }} isRoot={false} isYou={false} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LevelSection({ level, nodes }) {
  if (!nodes.length) return null;
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs">
          {level}
        </span>
        Level {level}
      </h3>
      <div className="flex flex-wrap gap-4 justify-center">
        {nodes.map((node) => (
          <div key={node.id} className="flex flex-col items-center">
            <div
              className={`rounded border px-2 py-1.5 text-center min-w-[100px] max-w-[120px] shadow-sm text-xs ${
                level === 0
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-medium truncate" title={node.name}>{node.name}</p>
              {node.email && (
                <p className="text-xs text-slate-500 truncate mt-0.5" title={node.email}>{node.email}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Flatten binary tree (node.left, node.right) into levels for level-by-level display */
function flattenBinaryByLevel(node, level = 0, acc = []) {
  if (!node) return acc;
  if (!acc[level]) acc[level] = [];
  acc[level].push(node);
  flattenBinaryByLevel(node.left, level + 1, acc);
  flattenBinaryByLevel(node.right, level + 1, acc);
  return acc;
}

export default function BinaryTree() {
  const [maxDepth, setMaxDepth] = useState(6);
  const [viewMode, setViewMode] = useState('tree'); // 'levels' | 'tree'
  const currentUser = getStoredUser();

  const { data: tree, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['binaryTree', maxDepth],
    queryFn: () => getBinaryTree(maxDepth),
    select: (res) => res?.data?.tree ?? null,
  });
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load binary tree') : '';

  const binaryTree = tree ?? null;
  const levels = binaryTree ? flattenBinaryByLevel(binaryTree) : [];
  const isRootYou = currentUser && binaryTree && String(binaryTree.id) === String(currentUser._id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Binary Tree</h1>
      <p className="mt-1 text-slate-600 text-sm">
        You are the root (parent). This is your placement tree: left and right children below. Commission is level-wise; referral (sponsor) is separate.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-2 text-slate-600">
          Max depth:
          <select
            value={maxDepth}
            onChange={(e) => setMaxDepth(Number(e.target.value))}
            className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setViewMode('levels')}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              viewMode === 'levels' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            By levels
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              viewMode === 'tree' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tree view
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-6 shadow-sm">
        {loading && (
          <p className="text-center text-slate-500 text-xs py-8">Loading binary tree…</p>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-red-700 text-xs">{error}</div>
        )}
        {!loading && !error && !binaryTree && (
          <p className="text-center text-slate-500 text-xs py-8">No placement yet. You are the root; new users will be placed under you in the tree.</p>
        )}
        {!loading && !error && binaryTree && viewMode === 'tree' && (
          <div className="overflow-x-auto py-4 flex justify-center">
            <BinaryTreeNode node={binaryTree} isRoot={true} isYou={isRootYou} />
          </div>
        )}
        {!loading && !error && binaryTree && viewMode === 'levels' && (
          <div className="space-y-6">
            {levels.map((nodes, index) => (
              <LevelSection key={index} level={index} nodes={nodes} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
