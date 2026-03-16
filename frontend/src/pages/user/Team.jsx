import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyTeam, updateUser, deleteUser } from '../../api/admin.js';
import { getStoredUser } from '../../api/auth.js';

const TEAM_QUERY_KEY = ['team'];

const TeamIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

export default function Team() {
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user', isActive: true, panNumber: '', bankAccountNumber: '', upiId: '' });
  const [editError, setEditError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === 'admin';

  const { data: teamData, isLoading: loading, error: teamError, refetch } = useQuery({
    queryKey: TEAM_QUERY_KEY,
    queryFn: getMyTeam,
    select: (res) => res?.data?.users ?? [],
  });
  const teamMembers = teamData ?? [];
  const error = teamError ? (teamError.response?.data?.error ?? 'Failed to load team') : '';

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY });
      closeEdit();
    },
    onError: (err) => {
      setEditError(err.response?.data?.error ?? 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY });
      setDeleteConfirm(null);
    },
  });

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name ?? '',
      email: u.email ?? '',
      role: u.role ?? 'user',
      isActive: u.isActive ?? false,
      panNumber: u.panNumber ?? '',
      bankAccountNumber: u.bankAccountNumber ?? '',
      upiId: u.upiId ?? '',
    });
    setEditError('');
  };

  const closeEdit = () => {
    setEditUser(null);
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser?._id) return;
    setEditError('');
    updateMutation.mutate({
      id: editUser._id,
      payload: {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        isActive: editForm.isActive,
        panNumber: editForm.panNumber.trim(),
        bankAccountNumber: editForm.bankAccountNumber.trim(),
        upiId: editForm.upiId.trim(),
      },
    });
  };

  const handleDeleteClick = (u) => {
    setDeleteConfirm(u);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm?._id) return;
    deleteMutation.mutate(deleteConfirm._id);
  };

  if (loading) {
    return (
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <TeamIcon />
          Team
        </h1>
        <p className="mt-1 text-slate-600">Your referrals and downline.</p>
        <div className="mt-8 flex justify-center py-12">
          <p className="text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <TeamIcon />
          Team
        </h1>
        <p className="mt-1 text-slate-600">Your referrals and downline.</p>
        <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <TeamIcon />
        {isAdmin ? 'My Team' : 'Team'}
      </h1>
      <p className="mt-1 text-slate-600">
        {isAdmin
          ? 'Manage your downline. View details, edit or remove team members.'
          : 'Your referrals and downline (users who registered with your Referral ID).'}
      </p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Name</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Email</th>
              {isAdmin && (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">PAN</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Bank account</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">UPI ID</th>
                </>
              )}
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Role</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Joined</th>
              {isAdmin && (
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teamMembers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 5} className="px-4 py-12 text-center text-slate-500 text-sm">
                  No team members yet. Share your Referral ID to invite others.
                </td>
              </tr>
            ) : (
              teamMembers.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 text-center text-sm font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">{u.email}</td>
                  {isAdmin && (
                    <>
                      <td className="px-4 py-3 text-center text-sm text-slate-600">{u.panNumber || '—'}</td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600">{u.bankAccountNumber || '—'}</td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600">{u.upiId || '—'}</td>
                    </>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(u)}
                          className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" aria-modal="true">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Edit user</h2>
            <p className="mt-1 text-sm text-slate-500">{editUser.email}</p>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {editError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-pan" className="block text-sm font-medium text-slate-700">PAN number</label>
                  <input
                    id="edit-pan"
                    type="text"
                    value={editForm.panNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, panNumber: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-bank" className="block text-sm font-medium text-slate-700">Bank account number</label>
                  <input
                    id="edit-bank"
                    type="text"
                    value={editForm.bankAccountNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, bankAccountNumber: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-upi" className="block text-sm font-medium text-slate-700">UPI ID</label>
                <input
                  id="edit-upi"
                  type="text"
                  value={editForm.upiId}
                  onChange={(e) => setEditForm((f) => ({ ...f, upiId: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-slate-700">Role</label>
                  <select
                    id="edit-role"
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                    className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="edit-active"
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="edit-active" className="text-sm font-medium text-slate-700">Active</label>
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
                  disabled={updateMutation.isLoading}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateMutation.isLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete user?</h2>
            {deleteMutation.error && (
              <p className="mt-2 text-sm text-red-600">{deleteMutation.error.response?.data?.error ?? 'Failed to delete user'}</p>
            )}
            <p className="mt-2 text-sm text-slate-600">
              This will permanently remove <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email}). This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isLoading}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
