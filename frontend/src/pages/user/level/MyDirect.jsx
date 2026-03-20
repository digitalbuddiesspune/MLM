import { useQuery } from '@tanstack/react-query';
import { getMyTeam } from '../../../api/admin.js';

export default function UserMyDirect() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-level', 'my-direct'],
    queryFn: getMyTeam,
  });
  const rows = data?.data?.users ?? [];
  const message = error ? (error.response?.data?.error ?? 'Failed to load direct users') : '';

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Direct</h1>
      <p className="mt-1 text-slate-600">Users directly referred by you.</p>
      {isLoading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {message && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
      {!isLoading && !message && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full table-fixed divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-2/5 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                  <th className="w-2/5 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
                  <th className="w-1/5 px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">No direct users found.</td></tr>
                ) : rows.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900"><span className="block truncate">{u.name ?? '—'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.email ?? '—'}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="block truncate">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</span></td>
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
