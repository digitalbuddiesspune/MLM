import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWithdrawalRequest, getMyWithdrawalInfo } from '../../api/user.js';

export default function Wallet() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user-withdrawal-info'],
    queryFn: getMyWithdrawalInfo,
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load wallet') : '';
  const availableBalance = Number(data?.data?.availableBalance ?? 0);
  const kycStatus = data?.data?.kycStatus ?? 'none';
  const bankDetails = data?.data?.bankDetails ?? {};
  const requests = data?.data?.requests ?? [];

  const canWithdraw = useMemo(() => {
    return (
      kycStatus === 'approved' &&
      Number.isFinite(availableBalance) &&
      availableBalance > 0 &&
      bankDetails.bankAccountNumber &&
      bankDetails.ifscCode &&
      bankDetails.bankName &&
      bankDetails.branchName
    );
  }, [availableBalance, bankDetails, kycStatus]);

  const mutation = useMutation({
    mutationFn: (payload) => createWithdrawalRequest(payload),
    onSuccess: () => {
      setSuccess('Withdrawal request submitted successfully.');
      setFormError('');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['user-withdrawal-info'] });
      queryClient.invalidateQueries({ queryKey: ['user-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['user-transactions'] });
    },
    onError: (err) => {
      setSuccess('');
      setFormError(err?.response?.data?.error ?? err?.message ?? 'Failed to submit withdrawal request');
    },
  });

  const handleRequest = (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (parsed > availableBalance) {
      setFormError('Withdrawal amount cannot be greater than available balance.');
      return;
    }
    mutation.mutate({ amount: parsed });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
      <p className="mt-1 text-slate-600">Your balance and withdrawal request options.</p>
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <p className="text-sm font-medium text-slate-500">Available balance</p>
          <p className="mt-1 text-3xl font-bold text-teal-600">
            {loading ? 'Loading...' : `₹${availableBalance.toLocaleString()}`}
          </p>
          <p className="mt-2 text-xs text-slate-500">You can only request up to this amount.</p>
          <p className="mt-3 text-xs text-slate-500">KYC status: <span className="font-semibold uppercase">{kycStatus}</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Banking Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Account Number</p>
              <p className="mt-1 text-sm text-slate-800">{bankDetails.bankAccountNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">IFSC</p>
              <p className="mt-1 text-sm text-slate-800">{bankDetails.ifscCode || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Bank Name</p>
              <p className="mt-1 text-sm text-slate-800">{bankDetails.bankName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Branch</p>
              <p className="mt-1 text-sm text-slate-800">{bankDetails.branchName || '—'}</p>
            </div>
          </div>
          {!canWithdraw && !loading && (
            <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Complete and approve your KYC with valid bank details, and maintain positive wallet balance to request withdrawal.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Request Withdrawal</h2>
        <p className="mt-1 text-sm text-slate-600">Enter amount to withdraw (cannot be greater than available balance).</p>

        {formError && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
        )}
        {success && (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <form onSubmit={handleRequest} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="withdrawalAmount" className="block text-sm font-medium text-slate-700">Withdrawal Amount</label>
            <input
              id="withdrawalAmount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={!canWithdraw || mutation.isPending}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={!canWithdraw || mutation.isPending}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Submitting...' : 'Request withdrawal'}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Withdrawal Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">Loading...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">No withdrawal requests yet.</td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request._id}>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">₹{Number(request.amount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        request.status === 'approved' || request.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : request.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
