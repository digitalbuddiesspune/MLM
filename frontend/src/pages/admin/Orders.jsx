import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminOrders } from '../../api/admin.js';

export default function AdminOrders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['admin', 'orders', { status, page }],
    queryFn: () => getAdminOrders({ status: status || undefined, page, limit: 20 }),
    keepPreviousData: true,
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load orders') : '';
  const orders = data?.data?.orders ?? [];
  const pagination = data?.data?.pagination ?? { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
      <p className="mt-1 text-slate-600">All user orders and payment status.</p>

      <div className="mt-4 flex items-center gap-3">
        <label htmlFor="status" className="text-sm text-slate-600">Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Order</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Loading orders...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No orders found.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{order._id.slice(-8)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <p>{order.userId?.name ?? '—'}</p>
                    <p className="text-xs text-slate-500">{order.userId?.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{order.productSnapshot?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">Rs {order.amount?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
