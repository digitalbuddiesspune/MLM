import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminUserDetail, updateUser } from '../../api/admin.js';
import { formatBinaryMatchingDetail } from '../../utils/ledgerDisplay.js';

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value ?? '—'}</dd>
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '—';
  }
}

function relatedUserLink(rel) {
  if (rel == null) return '—';
  if (typeof rel === 'object' && rel._id) {
    return (
      <Link to={`/admin/users/${rel._id}`} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
        {rel.name ?? rel.email ?? String(rel._id).slice(-8)}
      </Link>
    );
  }
  const idStr = typeof rel === 'string' ? rel : String(rel);
  if (idStr.length >= 12) {
    return (
      <Link to={`/admin/users/${idStr}`} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline font-mono text-xs">
        Ref {idStr.slice(-8)}…
      </Link>
    );
  }
  return '—';
}

function sponsorReferralDisplay(sponsor) {
  if (!sponsor) return '';
  if (typeof sponsor === 'object' && sponsor.referralNumber != null) {
    return String(sponsor.referralNumber);
  }
  return '';
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [sponsorReferralCode, setSponsorReferralCode] = useState('');
  const [sponsorMessage, setSponsorMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'user-detail', id],
    queryFn: () => getAdminUserDetail(id),
    enabled: Boolean(id),
  });

  const message = error ? (error.response?.data?.error ?? 'Failed to load user') : '';
  const payload = data?.data;
  const user = payload?.user;

  useEffect(() => {
    setSponsorReferralCode(sponsorReferralDisplay(user?.sponsorId));
    setSponsorMessage('');
  }, [user?.sponsorId, id]);

  const sponsorMutation = useMutation({
    mutationFn: (code) => updateUser(id, { sponsorReferralCode: code }),
    onSuccess: async () => {
      setSponsorMessage('Sponsor referral ID updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => {
      setSponsorMessage(e?.response?.data?.error ?? 'Failed to update sponsor');
    },
  });
  const wallet = payload?.wallet;
  const kyc = payload?.kyc;
  const addresses = payload?.addresses ?? [];
  const ledger = payload?.ledger ?? [];
  const orders = payload?.orders ?? [];
  const withdrawals = payload?.withdrawals ?? [];
  const directReferrals = payload?.counts?.directReferrals ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/users" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            ← Back to Users
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {user?.name ?? (isLoading ? 'Loading…' : 'User')}
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{id}</p>
          {user && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{user.role ?? '—'}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">KYC: {user.kycStatus ?? 'none'}</span>
              <Link
                to={`/admin/level/my-hierarchy/${id}`}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Referral hierarchy
              </Link>
            </div>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading user…</p>}
      {message && !isLoading && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}

      {user && !isLoading && !message && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Account">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" value={user.email} />
                <Field label="Mobile" value={user.mobile} />
                <Field label="Referral #" value={user.referralNumber != null ? String(user.referralNumber) : '—'} />
                <Field label="Direct referrals (count)" value={String(directReferrals)} />
                <Field label="Rank / Level" value={`${user.rank ?? '—'} · level ${user.level ?? 0}`} />
                <Field label="Wallet balance (stored)" value={user.walletBalance != null ? `₹${Number(user.walletBalance).toLocaleString()}` : '—'} />
                <Field label="Approved" value={user.isApproved ? 'Yes' : 'No'} />
                <Field label="Created" value={fmtDate(user.createdAt)} />
                <Field label="Activation" value={fmtDate(user.activationDate)} />
                <Field label="Renewal" value={fmtDate(user.renewalDate)} />
                <Field label="Reward label" value={user.levelReward || '—'} className="sm:col-span-2" />
                <Field label="Joining bonus (field)" value={user.joiningBonusAmount != null ? `₹${Number(user.joiningBonusAmount).toLocaleString()}` : '—'} />
              </dl>
            </Card>

            <Card title="Binary placement">
              <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sponsor referral ID</p>
                <p className="mt-1 text-xs text-slate-500">
                  Registration sponsor (numeric referral code used when this user joined). Changing this updates the sponsor chain only — binary placement is unchanged.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="min-w-[10rem] flex-1">
                    <label htmlFor="sponsor-referral-code" className="sr-only">Sponsor referral ID</label>
                    <input
                      id="sponsor-referral-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={sponsorReferralCode}
                      onChange={(e) => setSponsorReferralCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 100001"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={sponsorMutation.isPending}
                    onClick={() => sponsorMutation.mutate(sponsorReferralCode)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {sponsorMutation.isPending ? 'Saving…' : 'Save sponsor'}
                  </button>
                  {user.sponsorId && (
                    <button
                      type="button"
                      disabled={sponsorMutation.isPending}
                      onClick={() => {
                        setSponsorReferralCode('');
                        sponsorMutation.mutate('');
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {user.sponsorId && (
                  <p className="mt-2 text-xs text-slate-600">
                    Current sponsor: {relatedUserLink(user.sponsorId)}
                  </p>
                )}
                {sponsorMessage && (
                  <p className={`mt-2 text-xs ${sponsorMessage.includes('updated') ? 'text-emerald-700' : 'text-red-600'}`}>
                    {sponsorMessage}
                  </p>
                )}
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Side under sponsor" value={user.placementSide ?? '—'} />
                <Field label="Placement sequence" value={String(user.placementSequence ?? user.placementIndex ?? 0)} />
                <Field label="Registration sponsor" value={relatedUserLink(user.sponsorId)} />
                <Field label="Binary parent" value={relatedUserLink(user.parentId)} />
                <Field label="Left child" value={relatedUserLink(user.leftChild)} />
                <Field label="Right child" value={relatedUserLink(user.rightChild)} />
                <Field label="Binary status" value={user.binaryStatus ?? '—'} />
                <Field label="Pair matched" value={user.pairMatched ? 'Yes' : 'No'} />
                <Field label="Stored children" value={String(user.children?.length ?? 0)} />
                <Field label="Manual placement" value={user.manualPlacement ? 'Yes' : 'No'} />
                <Field label="Placement moves" value={String(user.placementHistory?.length ?? 0)} />
              </dl>
            </Card>

            <Card title="Wallet record">
              {wallet ? (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ledger balance" value={wallet.balance != null ? `₹${Number(wallet.balance).toLocaleString()}` : '—'} />
                  <Field label="Wallet row ID" value={String(wallet._id)} className="sm:col-span-2 font-mono text-xs" />
                </dl>
              ) : (
                <p className="text-sm text-slate-500">No wallet row (balance may still show on user).</p>
              )}
            </Card>

            <Card title="Sponsor-centric pair stats">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="LEFT leg filled" value={String(user.binaryLeftCount ?? 0)} />
                <Field label="RIGHT leg filled" value={String(user.binaryRightCount ?? 0)} />
                <Field label="Pairs" value={String(user.pairCount ?? 0)} />
                <Field label="Binary income" value={`₹${Number(user.binaryIncome ?? 0).toLocaleString()}`} />
              </dl>
            </Card>
          </div>

          <Card title="KYC submission">
            {kyc ? (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{kyc.status}</span>
                  {kyc.reviewedAt && <span className="text-xs text-slate-500">Reviewed {fmtDate(kyc.reviewedAt)}</span>}
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Aadhaar" value={kyc.aadhaarNumber} />
                  <Field label="PAN" value={kyc.panNumber} />
                  <Field label="Bank a/c" value={kyc.bankAccountNumber} />
                  <Field label="IFSC" value={kyc.ifscCode} />
                  <Field label="Bank / Branch" value={`${kyc.bankName ?? ''} · ${kyc.branchName ?? ''}`} className="sm:col-span-2" />
                  <Field label="Nominee" value={`${kyc.nomineeName ?? ''} (${kyc.nomineeRelation ?? ''})`} className="sm:col-span-2" />
                  <Field label="Admin remarks" value={kyc.adminRemarks || '—'} className="sm:col-span-2" />
                </dl>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[['Aadhaar photo', kyc.aadhaarPhoto], ['PAN photo', kyc.panPhoto], ['Bank proof', kyc.bankProofPhoto]].map(
                    ([label, url]) =>
                      url ? (
                        <a key={label} href={url} target="_blank" rel="noreferrer" className="truncate text-indigo-600 hover:underline">
                          {label}
                        </a>
                      ) : null
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No KYC record submitted.</p>
            )}
          </Card>

          <Card title={`Saved addresses (${addresses.length})`}>
            {addresses.length === 0 ? (
              <p className="text-sm text-slate-500">No addresses.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {addresses.map((a) => (
                  <li key={a._id} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-medium text-slate-900">{a.fullName} · {a.phone}</p>
                    <p className="mt-1 text-slate-600">{a.streetAddress}</p>
                    <p className="mt-1 text-xs text-slate-500">{a.pincode} — {a.district}, {a.tehsil}, {a.state}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Recent ledger (${ledger.length} shown)`}>
            {ledger.length === 0 ? (
              <p className="text-sm text-slate-500">No ledger entries.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 pr-3 font-medium">Date</th>
                      <th className="pb-2 pr-3 font-medium">Type</th>
                      <th className="pb-2 pr-3 font-medium">Amount</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ledger.map((row) => (
                      <tr key={row._id} className="text-slate-700">
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(row.createdAt)}</td>
                        <td className="py-2 pr-3">{row.type ?? '—'}</td>
                        <td className={`py-2 pr-3 font-medium ${Number(row.amount) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {Number(row.amount) >= 0 ? '+' : ''}₹{Number(row.amount ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3">{row.status ?? '—'}</td>
                        <td className="py-2 text-slate-500">{formatBinaryMatchingDetail(row) ?? (row.referenceId ? `ref ${String(row.referenceId).slice(-6)}` : '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={`Orders (${orders.length} shown)`}>
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 pr-3 font-medium">Date</th>
                      <th className="pb-2 pr-3 font-medium">Product</th>
                      <th className="pb-2 pr-3 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((o) => (
                      <tr key={o._id}>
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(o.createdAt ?? o.paidAt)}</td>
                        <td className="py-2 pr-3">{o.productSnapshot?.name ?? '—'}</td>
                        <td className="py-2 pr-3">₹{Number(o.amount ?? 0).toLocaleString()}</td>
                        <td className="py-2">{o.status ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={`Withdrawals (${withdrawals.length} shown)`}>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-slate-500">No withdrawal requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 pr-3 font-medium">Date</th>
                      <th className="pb-2 pr-3 font-medium">Amount</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 font-medium">Bank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {withdrawals.map((w) => (
                      <tr key={w._id}>
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(w.createdAt)}</td>
                        <td className="py-2 pr-3">₹{Number(w.amount ?? 0).toLocaleString()}</td>
                        <td className="py-2 pr-3">{w.status ?? '—'}</td>
                        <td className="py-2 text-slate-600">{w.bankName ?? '—'} · {w.ifscCode ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
