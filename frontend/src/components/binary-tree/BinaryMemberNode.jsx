import { memo, useMemo } from 'react';
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
  const pk = member?.package ?? member?.rank ?? null;
  const bl = Number(member?.binaryLeftCount ?? 0);
  const br = Number(member?.binaryRightCount ?? 0);
  const income = Number(member?.binaryIncome ?? member?.matchingIncome ?? 0);
  const status = typeof member?.status === 'string' ? member.status : active ? 'active' : 'inactive';

  const kids = orderedChildren(member);
  const canCollapse = kids.length > 0;
  const isCollapsed = ui.collapseHas(id);

  const chip = useMemo(
    () =>
      [
        `L ${bl}`,
        `R ${br}`,
        income > 0 ? `₹${income.toLocaleString()}` : null,
      ].filter(Boolean),
    [bl, br, income]
  );

  return (
    <div
      className={`relative min-w-[180px] max-w-[200px] rounded-2xl border bg-gradient-to-br px-3 py-2.5 shadow-xl transition-transform duration-200 hover:scale-[1.02] ${
        isYou
          ? 'border-cyan-400/90 from-slate-900/95 to-cyan-950/80 ring-2 ring-cyan-400/60'
          : isFocused
            ? 'border-violet-400/90 from-slate-900/95 to-violet-950/70 ring-2 ring-violet-400/55'
            : active
              ? 'border-emerald-500/40 from-slate-900/95 to-emerald-950/40'
              : 'border-slate-600/50 from-slate-900/95 to-slate-950/80'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-slate-500" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-slate-500" />

      <div className="flex items-start gap-2.5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner ${
            active
              ? 'bg-gradient-to-br from-emerald-400 to-teal-600'
              : 'bg-gradient-to-br from-slate-500 to-slate-700'
          }`}
        >
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-slate-50">{name}</p>
            {isYou && (
              <span className="shrink-0 rounded-full bg-cyan-500/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-cyan-200">
                You
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">ID {refNum ?? '—'}</p>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-300">
            {pk ? <span className="text-slate-200">{String(pk)}</span> : <span className="text-slate-500">No package</span>}
            {side ? (
              <span className="ml-1.5 rounded bg-slate-800/80 px-1 py-px text-[9px] font-semibold uppercase text-amber-200">
                {side}
              </span>
            ) : null}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span
              className={`rounded-full px-1.5 py-px text-[9px] font-bold uppercase ${
                status === 'active' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-700/60 text-slate-300'
              }`}
            >
              {status}
            </span>
            {chip.map((t) => (
              <span key={t} className="rounded-full bg-slate-800/90 px-1.5 py-px text-[9px] font-medium text-slate-200">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-700/50 pt-2">
        {canCollapse ? (
          <button
            type="button"
            className="nodrag nopan rounded-lg bg-slate-800/90 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-700"
            onClick={() => ui.toggleCollapseId(id)}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        ) : (
          <span className="text-[10px] text-slate-500">Leaf</span>
        )}
        <button
          type="button"
          className="nodrag nopan rounded-lg bg-violet-600/30 px-2 py-1 text-[10px] font-semibold text-violet-100 hover:bg-violet-600/45"
          onClick={() => ui.setSubtreeAnchor(id)}
        >
          Subtree
        </button>
      </div>
    </div>
  );
}

export default memo(BinaryMemberNodeImpl);
