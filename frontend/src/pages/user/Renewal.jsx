import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyOrders } from '../../api/orders.js';

export default function Renewal() {
  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user', 'renewal-orders'],
    queryFn: getMyOrders,
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load renewal details') : '';
  const orders = data?.data?.orders ?? [];

  const renewalInfo = useMemo(() => {
    const paidOrders = orders.filter((order) => order.status === 'paid' && order.paidAt);
    if (paidOrders.length === 0) {
      return {
        activePlanName: '—',
        activePlanProductId: '',
        activationDate: null,
        expiryDate: null,
        status: 'No active plan',
      };
    }

    const latest = paidOrders.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];
    const activationDate = new Date(latest.paidAt);
    const expiryDate = new Date(activationDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const isExpired = Date.now() > expiryDate.getTime();
    return {
      activePlanName: latest.productSnapshot?.name ?? 'Purchased Plan',
      activePlanProductId: latest.productId ? String(latest.productId) : '',
      activationDate,
      expiryDate,
      status: isExpired ? 'Expired' : 'Active',
    };
  }, [orders]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Renewal</h1>
      <p className="mt-1 text-slate-600">Activation and renewal status.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading renewal details...</p>
        ) : (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-slate-500">Active Plan</dt>
              <dd className="mt-0.5 text-slate-900">{renewalInfo.activePlanName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Activation date</dt>
              <dd className="mt-0.5 text-slate-900">
                {renewalInfo.activationDate ? renewalInfo.activationDate.toLocaleDateString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Expiry date</dt>
              <dd className="mt-0.5 text-slate-900">
                {renewalInfo.expiryDate ? renewalInfo.expiryDate.toLocaleDateString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-0.5">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  renewalInfo.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : renewalInfo.status === 'Expired'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                }`}>
                  {renewalInfo.status}
                </span>
              </dd>
            </div>
          </dl>
        )}

        <Link
          to={renewalInfo.activePlanProductId ? `/checkout?productId=${renewalInfo.activePlanProductId}` : '/#products'}
          className="mt-6 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Renew now
        </Link>
      </div>
    </div>
  );
}
