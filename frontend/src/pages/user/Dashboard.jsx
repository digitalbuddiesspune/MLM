import { useState } from 'react';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getStoredUser } from '../../api/auth.js';
import { getMyWallet, getMyTransactions, getMyTeam } from '../../api/user.js';

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

export default function Dashboard() {
  const [copied, setCopied] = useState(false);
  const user = getStoredUser();
  const referralId = user?._id ?? '';

  const [walletQuery, transactionsQuery, teamQuery] = useQueries({
    queries: [
      {
        queryKey: ['user-dashboard', 'wallet'],
        queryFn: getMyWallet,
      },
      {
        queryKey: ['user-dashboard', 'transactions'],
        queryFn: getMyTransactions,
      },
      {
        queryKey: ['user-dashboard', 'team'],
        queryFn: getMyTeam,
      },
    ],
  });

  const loading = walletQuery.isLoading || transactionsQuery.isLoading || teamQuery.isLoading;
  const queryError = walletQuery.error || transactionsQuery.error || teamQuery.error;
  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load dashboard values') : '';

  const walletBalance = Number(walletQuery.data?.data?.balance ?? 0);
  const rank = walletQuery.data?.data?.rank ?? user?.rank ?? 'Beginner';
  const teamSize = Number(teamQuery.data?.data?.users?.length ?? 0);

  const monthEarnings = useMemo(() => {
    const transactions = transactionsQuery.data?.data?.transactions ?? [];
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return transactions
      .filter((entry) => {
        const date = entry.createdAt ? new Date(entry.createdAt) : null;
        if (!date || Number.isNaN(date.getTime())) return false;
        return (
          date.getMonth() === month &&
          date.getFullYear() === year &&
          entry.status === 'completed' &&
          Number(entry.amount ?? 0) > 0
        );
      })
      .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
  }, [transactionsQuery.data]);

  const handleCopyReferralId = async () => {
    if (!referralId) return;
    try {
      await navigator.clipboard.writeText(referralId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = referralId;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <DashboardIcon />
        Dashboard
      </h1>
      <p className="mt-1 text-slate-600">Overview of your account and activity.</p>
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Referral ID - copyable */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">Referral ID</p>
          <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-900" title={referralId}>
            {referralId || '—'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Share this ID when inviting others to register under you</p>
        </div>
        <button
          type="button"
          onClick={handleCopyReferralId}
          disabled={!referralId}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Wallet balance',
            value: loading ? 'Loading...' : `₹${walletBalance.toLocaleString()}`,
            sub: 'Available',
          },
          {
            label: 'This month',
            value: loading ? 'Loading...' : `₹${monthEarnings.toLocaleString()}`,
            sub: 'Earnings',
          },
          {
            label: 'Team size',
            value: loading ? 'Loading...' : String(teamSize),
            sub: 'Direct',
          },
          {
            label: 'Rank',
            value: loading ? 'Loading...' : rank,
            sub: 'Current',
          },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
