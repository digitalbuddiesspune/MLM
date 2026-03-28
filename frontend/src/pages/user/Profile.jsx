import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../../api/user.js';

export default function Profile() {
  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getMyProfile,
  });

  const error = queryError ? (queryError.response?.data?.error ?? 'Failed to load profile') : '';
  const user = data?.data?.user ?? null;

  const yesNo = (value) => (value ? 'Yes' : 'No');
  const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');
  const sponsor = user?.sponsorId;
  const parent = user?.parentId;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-slate-600">Your account details and network information.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading profile...</p>
        ) : (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Name</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Email</dt>
              <dd className="mt-1 text-sm text-slate-900">{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Mobile</dt>
              <dd className="mt-1 text-sm text-slate-900">{user?.mobile ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Role</dt>
              <dd className="mt-1 text-sm text-slate-900">{user?.role ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Wallet Balance</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-700">₹{Number(user?.walletBalance ?? 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Rank</dt>
              <dd className="mt-1 text-sm text-slate-900">{user?.rank ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Level</dt>
              <dd className="mt-1 text-sm text-slate-900">{user?.level ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Sponsored Users</dt>
              <dd className="mt-1 text-sm text-slate-900">{user?.sponsoredUsersCount ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">KYC Status</dt>
              <dd className="mt-1 text-sm text-slate-900">{user?.kycStatus ?? 'none'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Active</dt>
              <dd className="mt-1 text-sm text-slate-900">{yesNo(user?.isActive)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Approved</dt>
              <dd className="mt-1 text-sm text-slate-900">{yesNo(user?.isApproved)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Position</dt>
              <dd className="mt-1 text-sm text-slate-900">{user?.position ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Activation Date</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(user?.activationDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Renewal Date</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(user?.renewalDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">Joined At</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(user?.createdAt)}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs font-medium uppercase text-slate-500">Sponsor</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {sponsor ? `${sponsor.name ?? '—'} (${sponsor.email ?? '—'})` : '—'}
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs font-medium uppercase text-slate-500">Parent (Binary Tree)</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {parent ? `${parent.name ?? '—'} (${parent.email ?? '—'})` : '—'}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
