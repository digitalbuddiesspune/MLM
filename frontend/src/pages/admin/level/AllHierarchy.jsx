import { useQuery } from '@tanstack/react-query';
import { getAdminUsers } from '../../../api/admin.js';

export default function AdminAllHierarchy() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-level', 'all-hierarchy'],
    queryFn: () => getAdminUsers({ page: 1, limit: 1000 }),
  });
  const rows = data?.data?.users ?? [];
  const message = error ? (error.response?.data?.error ?? 'Failed to load hierarchy') : '';

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">All Hierarchy</h1>
      <p className="mt-1 text-slate-600">All users available in admin scope.</p>
      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {message && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
      {!isLoading && !message && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full table-fixed divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-4/12 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                  <th className="w-4/12 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
                  <th className="w-2/12 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Role</th>
                  <th className="w-2/12 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No hierarchy data found.</td></tr>
                ) : rows.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900"><span className="block truncate">{u.name ?? '—'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.email ?? '—'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.role ?? 'user'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.level ?? 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
