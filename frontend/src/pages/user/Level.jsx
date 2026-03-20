import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyTeam, getReferralTree } from '../../api/admin.js';

const LEVEL_VIEWS = ['My hierarchy', 'My user list', 'My Direct', 'All Hierarchy'];

function flattenTree(node, bucket = []) {
  if (!node) return bucket;
  bucket.push({ id: node.id, name: node.name, email: node.email, level: node.level });
  for (const child of node.children ?? []) flattenTree(child, bucket);
  return bucket;
}

export default function UserLevel() {
  const [view, setView] = useState('My hierarchy');

  const isDirect = view === 'My Direct';
  const isList = view === 'My user list';
  const isHierarchy = view === 'My hierarchy' || view === 'All Hierarchy';

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user-level', view],
    queryFn: async () => {
      if (isDirect) return getMyTeam();
      return getReferralTree(10);
    },
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load level data') : '';

  const rows = useMemo(() => {
    if (isDirect) return data?.data?.users ?? [];
    const tree = data?.data?.tree ?? null;
    if (!tree) return [];
    if (isList) return flattenTree(tree, []);
    return flattenTree(tree, []);
  }, [data, isDirect, isList]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Level</h1>
      <p className="mt-1 text-slate-600">View your hierarchy and users by level.</p>

      <div className="mt-4 max-w-sm">
        <label htmlFor="level-view" className="block text-sm font-medium text-slate-700">View</label>
        <select
          id="level-view"
          value={view}
          onChange={(e) => setView(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        >
          {LEVEL_VIEWS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        {view === 'All Hierarchy' && (
          <p className="mt-1 text-xs text-slate-500">Showing your hierarchy scope.</p>
        )}
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {error && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">No data found.</td>
                </tr>
              ) : rows.map((user) => (
                <tr key={user.id ?? user._id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{user.email ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{user.level ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
