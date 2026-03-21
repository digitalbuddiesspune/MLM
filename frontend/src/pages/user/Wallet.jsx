import { useQuery } from '@tanstack/react-query';
import { getMyWallet } from '../../api/user.js';

export default function Wallet() {
  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user-wallet'],
    queryFn: getMyWallet,
  });
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load wallet') : '';
  const balance = data?.data?.balance ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
      <p className="mt-1 text-slate-600">Your balance and payout options.</p>
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Available balance</p>
        <p className="mt-1 text-3xl font-bold text-teal-600">
          {loading ? 'Loading...' : `₹${Number(balance).toLocaleString()}`}
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            Request withdrawal
          </button>
        </div>
      </div>
    </div>
  );
}
