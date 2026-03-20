import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyOrders } from '../../api/orders.js';

export default function MyPlan() {
  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user', 'my-orders'],
    queryFn: getMyOrders,
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load your plan') : '';
  const orders = data?.data?.orders ?? [];

  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === 'paid'),
    [orders]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Plan</h1>
      <p className="mt-1 text-slate-600">Products you have purchased successfully.</p>

      {loading && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading your purchased products...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && paidOrders.length === 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          You have not purchased any plan yet.
        </div>
      )}

      {!loading && !error && paidOrders.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paidOrders.map((order) => (
            <article key={order._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="rounded-lg bg-slate-100 p-3">
                {order.productSnapshot?.imageUrl ? (
                  <img
                    src={order.productSnapshot.imageUrl}
                    alt={order.productSnapshot?.name ?? 'Product'}
                    className="mx-auto h-36 w-auto object-contain"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center text-xs text-slate-400">No image</div>
                )}
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{order.productSnapshot?.name ?? 'Product'}</h2>
              <p className="mt-1 text-sm text-slate-700">
                Amount: <span className="font-medium">Rs {order.amount?.toLocaleString() ?? 0}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Purchased on: {order.paidAt ? new Date(order.paidAt).toLocaleString() : '—'}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Paid
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
