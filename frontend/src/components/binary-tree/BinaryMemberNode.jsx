import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useBinaryTreeUi } from '../../context/BinaryTreeUiContext.jsx';
import { normId, orderedChildren } from '../../utils/binaryTreeLayout.js';

/** @typedef {{member: Record<string, unknown>, isYou?: boolean, isFocused?: boolean}} BinaryMemberData */

function initials(name) {
  const s = String(name ?? '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function BinaryMemberNodeImpl({ data }) {
  /** @type {BinaryMemberData} */
  const { member = {}, isYou, isFocused } = data ?? {};
  const ui = useBinaryTreeUi();

  const id = normId(member);
  const name = typeof member?.name === 'string' ? member.name : '—';
  const refNum = member?.referralNumber;
  const side = member?.placementSide ?? null;
  const active = !!member?.isActive;
  const status = typeof member?.status === 'string' ? member.status : active ? 'active' : 'inactive';

  const kids = orderedChildren(member);
  const canCollapse = kids.length > 0;
  const isCollapsed = ui.collapseHas(id);

  return (
    <div
      className={`relative min-w-[190px] max-w-[220px] rounded-xl border bg-white px-3 py-2.5 shadow-sm transition ${
        isYou
          ? 'border-blue-400 ring-2 ring-blue-100'
          : isFocused
            ? 'border-violet-400 ring-2 ring-violet-100'
            : active
              ? 'border-emerald-300'
              : 'border-slate-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-slate-300" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-slate-300" />

      <div className="flex items-start gap-2.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
            active
              ? 'bg-emerald-500'
              : 'bg-slate-500'
          }`}
        >
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            {isYou && (
              <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-blue-700">
                You
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-slate-500">ID {refNum ?? '—'}</p>
          {side ? (
            <p className="mt-0.5 text-[10px] font-semibold uppercase text-slate-500">{side}</p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span
              className={`rounded-full px-1.5 py-px text-[9px] font-bold uppercase ${
                status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        {canCollapse ? (
          <button
            type="button"
            className="nodrag nopan rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => ui.toggleCollapseId(id)}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        ) : (
          <span className="text-[10px] text-slate-400">Leaf</span>
        )}
        <button
          type="button"
          className="nodrag nopan rounded-md bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700 hover:bg-violet-100"
          onClick={() => ui.setSubtreeAnchor(id)}
        >
          Subtree
        </button>
      </div>
    </div>
  );
}

export default memo(BinaryMemberNodeImpl);
