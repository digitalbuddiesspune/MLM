import { useState, useEffect, useCallback } from 'react';
import { listAdminKyc, reviewKyc } from '../../api/kyc.js';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

function getDocumentUrl(value) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_BASE}/uploads/kyc/${value}`;
}

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function KycApprovals() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ submissions: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [remarks, setRemarks] = useState('');

  const fetchKyc = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminKyc({ status: status || undefined, page, limit: 10 });
      setData(res.data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  const handleReview = async (kycId, decision) => {
    setActionLoading(kycId);
    try {
      await reviewKyc(kycId, decision, remarks);
      setRemarks('');
      setSelectedKyc(null);
      await fetchKyc();
    } catch {
      // handle silently
    } finally {
      setActionLoading(null);
    }
  };

  const { submissions, pagination } = data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">KYC Approvals</h1>
      <p className="mt-1 text-slate-600">Review and approve user eKYC submissions.</p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="mt-8 text-center text-slate-500">Loading...</p>
      )}

      {!loading && submissions.length === 0 && (
        <p className="mt-8 text-center text-slate-500">No submissions found.</p>
      )}

      {!loading && submissions.length > 0 && (
        <div className="mt-6 space-y-4">
          {submissions.map((kyc) => (
            <div key={kyc._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{kyc.userId?.name ?? '—'}</p>
                  <p className="text-sm text-slate-500">{kyc.userId?.email} &middot; {kyc.userId?.mobile}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[kyc.status]}`}>
                  {kyc.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Aadhaar:</span>{' '}
                  <span className="font-medium text-slate-800">{kyc.aadhaarNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">PAN:</span>{' '}
                  <span className="font-medium text-slate-800">{kyc.panNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Bank A/C:</span>{' '}
                  <span className="font-medium text-slate-800">{kyc.bankAccountNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">IFSC:</span>{' '}
                  <span className="font-medium text-slate-800">{kyc.ifscCode}</span>
                </div>
                <div>
                  <span className="text-slate-500">Bank:</span>{' '}
                  <span className="font-medium text-slate-800">{kyc.bankName}, {kyc.branchName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Nominee:</span>{' '}
                  <span className="font-medium text-slate-800">{kyc.nomineeName} ({kyc.nomineeRelation})</span>
                </div>
              </div>

              {/* Photos */}
              <div className="mt-4 flex flex-wrap gap-4">
                {kyc.aadhaarPhoto && (
                  <a
                    href={getDocumentUrl(kyc.aadhaarPhoto)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-teal-600 hover:underline"
                  >
                    View Aadhaar Photo
                  </a>
                )}
                {kyc.panPhoto && (
                  <a
                    href={getDocumentUrl(kyc.panPhoto)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-teal-600 hover:underline"
                  >
                    View PAN Photo
                  </a>
                )}
                {kyc.bankProofPhoto && (
                  <a
                    href={getDocumentUrl(kyc.bankProofPhoto)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-teal-600 hover:underline"
                  >
                    View Bank Proof
                  </a>
                )}
              </div>

              {kyc.adminRemarks && (
                <p className="mt-3 text-sm text-slate-500">Remarks: {kyc.adminRemarks}</p>
              )}

              {/* Actions */}
              {kyc.status === 'pending' && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  {selectedKyc === kyc._id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Remarks (optional)</label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                          placeholder="Add any remarks..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(kyc._id, 'approved')}
                          disabled={actionLoading === kyc._id}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          {actionLoading === kyc._id ? 'Processing…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReview(kyc._id, 'rejected')}
                          disabled={actionLoading === kyc._id}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {actionLoading === kyc._id ? 'Processing…' : 'Reject'}
                        </button>
                        <button
                          onClick={() => { setSelectedKyc(null); setRemarks(''); }}
                          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedKyc(kyc._id)}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
