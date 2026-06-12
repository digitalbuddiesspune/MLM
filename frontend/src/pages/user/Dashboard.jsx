import { useState } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredUser } from '../../api/auth.js';
import {
  getMyWallet,
  getMyTransactions,
  getMyTeam,
  getOpenPlacementSlots,
  placeMyReferralInTree,
} from '../../api/user.js';
import { getCart } from '../../api/cart.js';
import { formatBinaryMatchingDetail } from '../../utils/ledgerDisplay.js';

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

function slotKey(parentId, side) {
  return `${parentId}:${side}`;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [selectedPlaceUserId, setSelectedPlaceUserId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [placeMessage, setPlaceMessage] = useState('');
  const user = getStoredUser();

  const { data: cartPayload } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });
  const cartCount = cartPayload?.data?.totalItems ?? 0;

  const [walletQuery, transactionsQuery, teamQuery] = useQueries({
    queries: [
      {
        queryKey: ['user-wallet'],
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
  const unplacedReferrals = useMemo(
    () => (teamQuery.data?.data?.users ?? []).filter((u) => !u.parentId),
    [teamQuery.data]
  );

  const { data: openSlotsPayload, isLoading: slotsLoading } = useQuery({
    queryKey: ['tree-open-slots', user?._id],
    queryFn: () => getOpenPlacementSlots(user?._id),
    enabled: Boolean(user?._id) && unplacedReferrals.length > 0,
  });
  const openSlots = openSlotsPayload?.data?.slots ?? [];

  const referralCode =
    walletQuery.data?.data?.referralNumber != null
      ? String(walletQuery.data.data.referralNumber)
      : user?.referralNumber != null
        ? String(user.referralNumber)
        : '';

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

  const latestBinaryMatchLabel = useMemo(() => {
    const list = transactionsQuery.data?.data?.transactions ?? [];
    for (const t of list) {
      if (t.type !== 'binary') continue;
      const label = formatBinaryMatchingDetail(t);
      if (label) return label;
    }
    return null;
  }, [transactionsQuery.data]);

  const placeMutation = useMutation({
    mutationFn: ({ userId, parentId, side }) =>
      placeMyReferralInTree({
        userId,
        sponsorId: user?._id,
        parentId,
        side,
      }),
    onSuccess: () => {
      setPlaceMessage('User placed in binary tree successfully.');
      setSelectedPlaceUserId('');
      setSelectedSlot('');
      queryClient.invalidateQueries({ queryKey: ['user-dashboard', 'team'] });
      queryClient.invalidateQueries({ queryKey: ['tree-open-slots'] });
      queryClient.invalidateQueries({ queryKey: ['binary-tree-flow'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'my-orders'] });
    },
    onError: (err) => {
      setPlaceMessage(err?.response?.data?.error ?? 'Placement failed');
    },
  });

  const handleCopyReferralId = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = referralCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedMember = useMemo(
    () => unplacedReferrals.find((u) => String(u._id) === String(selectedPlaceUserId)),
    [unplacedReferrals, selectedPlaceUserId]
  );

  const handlePlace = () => {
    if (!selectedPlaceUserId) {
      setPlaceMessage('Select a user to place first.');
      return;
    }
    if (!selectedSlot) {
      setPlaceMessage('Choose an open slot in your binary tree first.');
      return;
    }
    const [parentId, side] = selectedSlot.split(':');
    setPlaceMessage('');
    placeMutation.mutate({ userId: selectedPlaceUserId, parentId, side });
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

      {!loading && latestBinaryMatchLabel && (
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/90 px-4 py-3 text-sm text-teal-950 shadow-sm">
          <span className="font-semibold text-teal-900">Binary matching</span>
          <span className="ml-2 font-mono text-base font-bold tracking-tight text-teal-800">
            {latestBinaryMatchLabel}
          </span>
          <span className="ml-2 text-xs font-normal text-teal-700/90">Left + right pairing (per payout)</span>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">Referral code</p>
          <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-900" title={referralCode || undefined}>
            {referralCode || '—'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Digits only — share this code when others register under you</p>
        </div>
        <button
          type="button"
          onClick={handleCopyReferralId}
          disabled={!referralCode}
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/user/my-plan"
          className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/80 p-4 shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-600 text-lg text-white">🛍️</span>
          <div>
            <p className="font-semibold text-slate-900">Browse plans</p>
            <p className="text-xs text-slate-600">View all products & add to cart</p>
          </div>
        </Link>
        <Link
          to="/user/cart"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <span className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-lg text-white">
            🛒
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </span>
          <div>
            <p className="font-semibold text-slate-900">My cart</p>
            <p className="text-xs text-slate-600">
              {cartCount > 0 ? `${cartCount} item(s) — checkout` : 'Cart is empty'}
            </p>
          </div>
        </Link>
        <Link
          to="/user/wallet"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm transition hover:border-emerald-300"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-lg text-white">💰</span>
          <div>
            <p className="font-semibold text-slate-900">Wallet</p>
            <p className="text-xs text-slate-600">₹{walletQuery.isLoading ? '…' : walletBalance.toLocaleString()} available</p>
          </div>
        </Link>
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

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Place referred users in binary tree</h2>
        <p className="mt-1 text-xs text-slate-600">
          New members stay unplaced until you choose an open left or right slot at any end node in your tree.
        </p>

        {placeMessage ? (
          <p className={`mt-3 rounded-md px-3 py-2 text-xs ${placeMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {placeMessage}
          </p>
        ) : null}

        {unplacedReferrals.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No pending referred users to place.</p>
        ) : (
          <div className="mt-3 space-y-4">
            <label className="block text-xs font-medium text-slate-600">
              Select user to place
              <select
                value={selectedPlaceUserId}
                onChange={(e) => {
                  setSelectedPlaceUserId(e.target.value);
                  setSelectedSlot('');
                  setPlaceMessage('');
                }}
                className="mt-1 block w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Choose a referred member…</option>
                {unplacedReferrals.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} (ID {member.referralNumber ?? '—'})
                  </option>
                ))}
              </select>
            </label>

            {selectedPlaceUserId && selectedMember ? (
              <div className="rounded-lg border border-slate-200 px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{selectedMember.name}</p>
                    <p className="text-xs text-slate-500">{selectedMember.email}</p>
                  </div>
                  <Link
                    to={`/user/binary-tree?placeUserId=${encodeURIComponent(selectedMember._id)}`}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Pick on tree →
                  </Link>
                </div>

                {slotsLoading ? (
                  <p className="mt-3 text-sm text-slate-500">Loading open slots…</p>
                ) : openSlots.length === 0 ? (
                  <p className="mt-3 text-sm text-amber-700">No open slots in your binary tree yet.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="min-w-[220px] flex-1 text-xs font-medium text-slate-600">
                      Open slot
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                      >
                        <option value="">Select end node…</option>
                        {openSlots.map((slot) => (
                          <option
                            key={slotKey(slot.parentId, slot.side)}
                            value={slotKey(slot.parentId, slot.side)}
                          >
                            {slot.parentName} (ID {slot.parentReferralNumber ?? '—'}) — {slot.side.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={handlePlace}
                      disabled={placeMutation.isPending || !selectedSlot}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      Place here
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
