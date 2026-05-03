import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminUserReferralTree, getReferralTree } from '../../../api/admin.js';

const PlusSquareIcon = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <path strokeLinecap="round" d="M12 8v8M8 12h8" />
  </svg>
);

const MinusSquareIcon = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <path strokeLinecap="round" d="M8 12h8" />
  </svg>
);

function buildUsersByLevel(rootNode) {
  const byLevel = new Map();
  if (!rootNode) return byLevel;

  const queue = (rootNode.children ?? []).map((child) => ({ ...child, level: 1 }));
  while (queue.length > 0) {
    const node = queue.shift();
    if (!byLevel.has(node.level)) byLevel.set(node.level, []);
    byLevel.get(node.level).push({
      id: node.id,
      name: node.name,
      email: node.email,
      mobile: node.mobile,
    });

    for (const child of node.children ?? []) {
      queue.push({ ...child, level: node.level + 1 });
    }
  }

  return byLevel;
}

export default function AdminMyHierarchy() {
  const { rootUserId } = useParams();
  /** Levels with expanded user table; empty ⇒ all collapsed on first load */
  const [expandedLevels, setExpandedLevels] = useState(() => new Set());

  useEffect(() => {
    setExpandedLevels(new Set());
  }, [rootUserId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-level', 'my-hierarchy', rootUserId ?? 'me'],
    queryFn: () =>
      rootUserId ? getAdminUserReferralTree(rootUserId, 15) : getReferralTree(15),
  });
  const usersByLevel = buildUsersByLevel(data?.data?.tree ?? null);
  const sortedLevels = Array.from(usersByLevel.keys()).sort((a, b) => a - b);
  const totalUsers = sortedLevels.reduce((sum, level) => sum + usersByLevel.get(level).length, 0);
  const message = error ? (error.response?.data?.error ?? 'Failed to load hierarchy') : '';

  const toggleLevel = (level) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const rootName = data?.data?.tree?.name;
  const viewingOther = Boolean(rootUserId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Hierarchy</h1>
      <p className="mt-1 text-slate-600">
        {viewingOther
          ? 'Referral downline for the selected user, grouped level-wise (Level 1 = their direct referrals).'
          : 'Users joined via your referral ID, grouped level-wise.'}
      </p>
      {viewingOther && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {!isLoading && (
            <span className="text-slate-700">
              Root member:{' '}
              <span className="font-semibold text-slate-900">{rootName ?? '—'}</span>
            </span>
          )}
          <Link
            to="/admin/level/my-hierarchy"
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← My own hierarchy
          </Link>
        </div>
      )}
      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {message && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
      {!isLoading && !message && (
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total hierarchy users</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalUsers}</p>
          </div>

          {sortedLevels.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
              No hierarchy users found.
            </div>
          ) : (
            sortedLevels.map((level) => {
              const users = usersByLevel.get(level) ?? [];
              const isOpen = expandedLevels.has(level);
              return (
                <div key={level} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div
                    className={`flex items-center justify-between gap-3 px-4 py-3 ${isOpen ? 'border-b border-slate-200 bg-slate-50' : 'bg-slate-50'}`}
                  >
                    <h2 className="min-w-0 text-sm font-semibold text-slate-900">Level {level}</h2>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {users.length} users
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleLevel(level)}
                        className="flex items-center justify-center rounded-md border border-slate-300 bg-white p-1 text-slate-700 shadow-sm hover:bg-slate-100"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? `Collapse level ${level}` : `Expand level ${level}`}
                      >
                        {isOpen ? <MinusSquareIcon /> : <PlusSquareIcon />}
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="min-w-[720px] w-full table-fixed divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="w-1/3 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                            <th className="w-1/3 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
                            <th className="w-1/3 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Mobile</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.map((u) => (
                            <tr key={u.id}>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                <span className="block truncate">{u.name ?? '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                <span className="block truncate">{u.email ?? '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                <span className="block truncate">{u.mobile ?? '—'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
