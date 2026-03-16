import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { getAdminStats, getAdminUsers } from '../../api/admin.js';
import { getStoredUser } from '../../api/auth.js';

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [copied, setCopied] = useState(false);
  const user = getStoredUser();
  const referralId = user?._id ?? '';

  const [statsQuery, usersQuery, adminsQuery] = useQueries({
    queries: [
      {
        queryKey: ['admin', 'stats'],
        queryFn: getAdminStats,
        select: (res) => res?.data ?? null,
      },
      {
        queryKey: ['admin', 'users', { page: 1, limit: 5 }],
        queryFn: () => getAdminUsers({ page: 1, limit: 5 }),
        select: (res) => ({ users: res?.data?.users ?? [], pagination: res?.data?.pagination }),
      },
      {
        queryKey: ['admin', 'users', 'admins', { page: 1, limit: 5 }],
        queryFn: () => getAdminUsers({ role: 'admin', page: 1, limit: 5 }),
        select: (res) => ({ users: res?.data?.users ?? [], pagination: res?.data?.pagination }),
      },
    ],
  });

  const stats = statsQuery.data ?? null;
  const recentUsers = usersQuery.data?.users ?? [];
  const usersTotal = usersQuery.data?.pagination?.total ?? 0;
  const admins = adminsQuery.data?.users ?? [];
  const adminsTotal = adminsQuery.data?.pagination?.total ?? 0;
  const loading = statsQuery.isLoading || usersQuery.isLoading || adminsQuery.isLoading;
  const errorMessage = statsQuery.error || usersQuery.error || adminsQuery.error;
  const error = errorMessage ? (errorMessage.response?.data?.error ?? 'Failed to load dashboard') : '';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>
    );
  }

  const statCards = [
    { label: 'Total users', value: stats?.totalUsers ?? 0, sub: 'All roles', icon: '👥' },
    { label: 'Admins', value: adminsTotal, sub: 'Admin accounts', icon: '🛡️' },
    { label: 'Active users', value: stats?.activeUsers ?? 0, sub: 'Currently active', icon: '✅' },
    { label: 'Total wallet balance', value: `₹${(stats?.totalWalletBalance ?? 0).toLocaleString()}`, sub: 'Platform', icon: '💰' },
    { label: 'Pending payouts', value: `₹${(stats?.pendingPayoutAmount ?? 0).toLocaleString()}`, sub: 'Unprocessed', icon: '⏳' },
    { label: 'Payout runs', value: stats?.payoutRunsCount ?? 0, sub: 'Completed', icon: '📋' },
  ];

  return (
    <div> 
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <DashboardIcon />
        Admin Dashboard
      </h1>
      <p className="mt-1 text-slate-600">Overview of the platform.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">Referral ID</p>
          <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-900">{referralId || '—'}</p>
          <p className="mt-0.5 text-xs text-slate-500">Share this ID when inviting others to register under you</p>
        </div>
        <button
          type="button"
          onClick={handleCopyReferralId}
          disabled={!referralId}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Link
          to="/admin/team"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-2xl">👥</span>
          <div>
            <p className="font-semibold text-slate-900">My Team</p>
            <p className="text-sm text-slate-500">View your referrals and downline</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          to="/admin/binary-tree"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-2xl">🌳</span>
          <div>
            <p className="font-semibold text-slate-900">Binary Tree</p>
            <p className="text-sm text-slate-500">View placement and downline structure</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ label, value, sub, icon }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
              </div>
              <span className="text-2xl" aria-hidden>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Users ({usersTotal})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'admins'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admins ({adminsTotal})
            </button>
          </div>
          <Link
            to={activeTab === 'users' ? '/admin/users' : '/admin/admins'}
            className="mr-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === 'users' ? (
              recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No users yet.</td>
                </tr>
              ) : (
                recentUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">No admins yet.</td>
              </tr>
            ) : (
              admins.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
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
