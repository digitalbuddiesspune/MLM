import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateUser } from '../../api/admin.js';

function accountStatusBadge(isActive) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {isActive ? 'Released' : 'On hold'}
    </span>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusTarget, setStatusTarget] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'user',
    isActive: true,
  });
  const [editError, setEditError] = useState('');

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

  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: async () => {
      setActionMessage('User updated successfully.');
      closeEdit();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => {
      setEditError(e?.response?.data?.error ?? 'Failed to update user');
    },
  });

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name ?? '',
      email: user.email ?? '',
      mobile: user.mobile ?? '',
      role: user.role ?? 'user',
      isActive: user.isActive ?? false,
    });
    setEditError('');
  };

  const closeEdit = () => {
    setEditUser(null);
    setEditError('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editUser?._id) return;
    setEditError('');
    editMutation.mutate({
      id: editUser._id,
      payload: {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        mobile: editForm.mobile.trim(),
        role: editForm.role,
        isActive: editForm.isActive,
      },
    });
  };

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
      {actionMessage && (
        <p className="mt-3 text-sm text-slate-600">{actionMessage}</p>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <label className="flex min-w-[14rem] flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name or email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
        <label className="flex min-w-[9rem] flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Role</span>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="flex min-w-[9rem] flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All status</option>
            <option value="true">Released</option>
            <option value="false">On hold</option>
          </select>
        </label>
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    {accountStatusBadge(u.isActive)}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      {u.role !== 'admin' && (
                        u.isActive ? (
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
                        )
                      )}
                    </div>
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

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" aria-modal="true">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Edit user</h2>
            <p className="mt-1 text-sm text-slate-500">{editUser.email}</p>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {editError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="users-edit-name" className="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    id="users-edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="users-edit-email" className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    id="users-edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="users-edit-mobile" className="block text-sm font-medium text-slate-700">Mobile</label>
                <input
                  id="users-edit-mobile"
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="users-edit-role" className="block text-sm font-medium text-slate-700">Role</label>
                  <select
                    id="users-edit-role"
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="users-edit-status" className="block text-sm font-medium text-slate-700">Status</label>
                  <select
                    id="users-edit-status"
                    value={editForm.isActive ? 'released' : 'hold'}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, isActive: e.target.value === 'released' }))
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="released">Released</option>
                    <option value="hold">On hold</option>
                  </select>
                  <p className="mt-1.5">{accountStatusBadge(editForm.isActive)}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
