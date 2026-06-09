import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ListPagination from '../../components/ListPagination.jsx';
import { getAdminOrders, updateAdminOrderFulfillment } from '../../api/admin.js';

const PAGE_SIZE = 20;

const FULFILLMENT_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function shippingAddressToText(address) {
  if (!address?.fullName) return '';
  const cityLine = [address.tehsil, address.district].filter(Boolean).join(', ');
  const cityWithPin = cityLine + (address.pincode ? ` — ${address.pincode}` : '');
  return [
    `${address.fullName} (${address.phone})`,
    address.streetAddress,
    cityWithPin || null,
    address.state,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatShippingAddress(address) {
  if (!address?.fullName) return null;
  return (
    <>
      <p className="font-medium text-slate-900">{address.fullName} ({address.phone})</p>
      {address.streetAddress ? (
        <p className="mt-0.5 text-slate-700">{address.streetAddress}</p>
      ) : null}
      <p className="mt-0.5 text-xs text-slate-500">
        {[address.tehsil, address.district].filter(Boolean).join(', ')}
        {address.pincode ? ` — ${address.pincode}` : ''}
      </p>
      {address.state ? <p className="text-xs text-slate-500">{address.state}</p> : null}
    </>
  );
}

function CopyAddressButton({ address }) {
  const [copied, setCopied] = useState(false);
  const text = shippingAddressToText(address);
  if (!text) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy address"
      className="shrink-0 rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      aria-label="Copy shipping address"
    >
      {copied ? (
        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function paymentStatusClass(status) {
  if (status === 'paid') return 'bg-green-100 text-green-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function fulfillmentStatusClass(status) {
  if (status === 'delivered') return 'bg-green-100 text-green-700';
  if (status === 'shipped') return 'bg-indigo-100 text-indigo-700';
  if (status === 'packed') return 'bg-blue-100 text-blue-700';
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const status = searchParams.get('status') ?? '';
  const fulfillmentStatus = searchParams.get('fulfillmentStatus') ?? '';
  const today = searchParams.get('today') === '1';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [updateError, setUpdateError] = useState('');

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['admin', 'orders', { status, fulfillmentStatus, today, page }],
    queryFn: () => getAdminOrders({
      status: status || undefined,
      fulfillmentStatus: fulfillmentStatus || undefined,
      today: today ? '1' : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    keepPreviousData: true,
  });

  const updateFulfillmentMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }) => updateAdminOrderFulfillment(orderId, nextStatus),
    onSuccess: () => {
      setUpdateError('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (err) => {
      setUpdateError(err?.response?.data?.error ?? 'Failed to update fulfillment status');
    },
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load orders') : '';
  const orders = data?.data?.orders ?? [];
  const pagination = data?.data?.pagination ?? { page: 1, totalPages: 1, total: 0, limit: PAGE_SIZE };

  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === false || value == null) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    if (!('page' in updates)) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  useEffect(() => {
    const totalPages = Math.max(1, pagination.totalPages ?? 1);
    if (page > totalPages) {
      updateFilters({ page: totalPages <= 1 ? '' : totalPages });
    }
  }, [pagination.totalPages, page]);

  useEffect(() => {
    setUpdateError('');
  }, [status, fulfillmentStatus, today, page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
      <p className="mt-1 text-slate-600">Manage orders, filter by date, and update shipping status.</p>

      <div className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="payment-status" className="block text-sm text-slate-600">Payment</label>
          <select
            id="payment-status"
            value={status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label htmlFor="fulfillment-status" className="block text-sm text-slate-600">Fulfillment</label>
          <select
            id="fulfillment-status"
            value={fulfillmentStatus}
            onChange={(e) => updateFilters({ fulfillmentStatus: e.target.value })}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {FULFILLMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={today}
            onChange={(e) => updateFilters({ today: e.target.checked ? '1' : '' })}
            className="rounded border-slate-300"
          />
          Today&apos;s orders only
        </label>

        {(status || fulfillmentStatus || today) && (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="pb-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {(error || updateError) && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || updateError}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Order</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Ship to</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Fulfillment</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">Loading orders...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">No orders found.</td>
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
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        {formatShippingAddress(order.shippingAddress) ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                      {order.shippingAddress?.fullName ? (
                        <CopyAddressButton address={order.shippingAddress} />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">Rs {order.amount?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.status === 'paid' ? (
                      <select
                        value={order.fulfillmentStatus ?? 'pending'}
                        disabled={updateFulfillmentMutation.isPending}
                        onChange={(e) => {
                          updateFulfillmentMutation.mutate({
                            orderId: order._id,
                            nextStatus: e.target.value,
                          });
                        }}
                        className={`rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium ${fulfillmentStatusClass(order.fulfillmentStatus ?? 'pending')}`}
                      >
                        {FULFILLMENT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && pagination.total > 0 && (
          <ListPagination
            page={pagination.page}
            totalPages={Math.max(1, pagination.totalPages)}
            total={pagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={(nextPage) => updateFilters({ page: nextPage <= 1 ? '' : nextPage })}
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}
