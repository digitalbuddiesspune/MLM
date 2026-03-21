import { useQuery } from '@tanstack/react-query';
import { getMyTransactions } from '../../api/user.js';

function formatType(type = '') {
  return String(type)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Transactions() {
  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user-transactions'],
    queryFn: getMyTransactions,
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load transactions') : '';
  const transactions = data?.data?.transactions ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
      <p className="mt-1 text-slate-600">Ledger and transaction history.</p>
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No transactions yet.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr key={txn._id}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {txn.createdAt ? new Date(txn.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatType(txn.type)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                    +₹{Number(txn.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {txn.status ? formatType(txn.status) : 'Completed'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
