import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateUser } from '../../api/admin.js';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusTarget, setStatusTarget] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const params = {
    page,
    limit: 10,
    search: search || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter === '' ? undefined : statusFilter,
  };

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => getAdminUsers(params),
    keepPreviousData: true,
  });

  const users = data?.data?.users ?? [];
  const pagination = data?.data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUser(id, { isActive }),
    onSuccess: async (_res, variables) => {
      setActionMessage(variables.isActive ? 'User released successfully.' : 'User placed on hold.');
      setStatusTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => {
      setActionMessage(e?.response?.data?.error ?? 'Failed to update user status');
      setStatusTarget(null);
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openStatusConfirm = (user, nextIsActive) => {
    setStatusTarget({ user, nextIsActive });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <p className="mt-1 text-slate-600">Manage registered users. Hold or release accounts without removing them from the binary tree.</p>
      {actionMessage && (
        <p className="mt-3 text-sm text-slate-600">{actionMessage}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Search
          </button>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
        >
          <option value="">All status</option>
          <option value="true">Released</option>
          <option value="false">On hold</option>
        </select>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Mobile</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">KYC</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">Loading…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      to={`/admin/users/${u._id}`}
                      className="font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
                    >
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.mobile ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {u.isActive ? 'Released' : 'On hold'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.kycStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      u.kycStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                      u.kycStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.kycStatus ?? 'none'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.rank ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : u.isActive ? (
                      <button
                        type="button"
                        onClick={() => openStatusConfirm(u, false)}
                        className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        Hold
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openStatusConfirm(u, true)}
                        className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                      >
                        Release
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={pagination.page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {statusTarget.nextIsActive ? 'Release user' : 'Hold user'}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {statusTarget.nextIsActive ? (
                <>
                  Release <span className="font-semibold text-slate-900">{statusTarget.user.name}</span>? Their account will become active again. Their binary tree position stays unchanged.
                </>
              ) : (
                <>
                  Place <span className="font-semibold text-slate-900">{statusTarget.user.name}</span> on hold? They will be deactivated but remain in the binary tree.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => statusMutation.mutate({
                  id: statusTarget.user._id,
                  isActive: statusTarget.nextIsActive,
                })}
                disabled={statusMutation.isPending}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                  statusTarget.nextIsActive
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {statusMutation.isPending
                  ? 'Saving...'
                  : statusTarget.nextIsActive
                    ? 'Yes, Release'
                    : 'Yes, Hold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
