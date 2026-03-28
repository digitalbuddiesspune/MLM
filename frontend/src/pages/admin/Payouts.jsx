import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminWithdrawalRequests, reviewAdminWithdrawalRequest } from '../../api/admin.js';

export default function AdminPayouts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionError, setActionError] = useState('');

  const params = {
    page,
    limit: 10,
    status: statusFilter || undefined,
    search: search || undefined,
  };

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['admin', 'withdrawal-requests', params],
    queryFn: () => getAdminWithdrawalRequests(params),
    keepPreviousData: true,
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load withdrawal requests') : '';
  const requests = data?.data?.requests ?? [];
  const pagination = data?.data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }) => reviewAdminWithdrawalRequest(id, { status }),
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawal-requests'] });
    },
    onError: (err) => {
      setActionError(err?.response?.data?.error ?? err?.message ?? 'Failed to update withdrawal request');
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
      <p className="mt-1 text-slate-600">Manage user withdrawal requests and payout processing.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {actionError && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      <div className="mt-6 flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by username, email, mobile"
            className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm focus:border-indigo-500"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">User</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Contact</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Amount</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Bank Details</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Requested At</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Loading…</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No withdrawal requests found.</td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request._id}>
                  <td className="px-4 py-3 text-center text-sm font-medium text-slate-900">{request.userId?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">
                    <div>{request.userId?.email ?? '—'}</div>
                    <div className="text-xs text-slate-500">{request.userId?.mobile ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                    ₹{Number(request.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-600">
                    <div>A/C: {request.bankAccountNumber ?? '—'}</div>
                    <div>IFSC: {request.ifscCode ?? '—'}</div>
                    <div>{request.bankName ?? '—'} - {request.branchName ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      request.status === 'paid' || request.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : request.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-500">
                    {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {request.status === 'pending' ? (
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: request._id, status: 'approved' })}
                          className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: request._id, status: 'rejected' })}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    ) : request.status === 'approved' ? (
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: request._id, status: 'paid' })}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          Mark Paid
                        </button>
                        <button
                          type="button"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: request._id, status: 'rejected' })}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No actions</span>
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
    </div>
  );
}
