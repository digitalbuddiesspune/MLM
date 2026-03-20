import { useState, useEffect } from 'react';
import { getMyKyc, submitKyc } from '../../api/kyc.js';

const STATUS_STYLES = {
  none: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  none: 'Not Submitted',
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60';
const fileClass =
  'mt-1 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100';

export default function Ekyc() {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);
  const [panNumber, setPanNumber] = useState('');
  const [panPhoto, setPanPhoto] = useState(null);
  const [bankProofPhoto, setBankProofPhoto] = useState(null);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyKyc();
        if (res.data) {
          setKyc(res.data);
          setAadhaarNumber(res.data.aadhaarNumber ?? '');
          setPanNumber(res.data.panNumber ?? '');
          setBankAccountNumber(res.data.bankAccountNumber ?? '');
          setIfscCode(res.data.ifscCode ?? '');
          setBankName(res.data.bankName ?? '');
          setBranchName(res.data.branchName ?? '');
          setNomineeName(res.data.nomineeName ?? '');
          setNomineeRelation(res.data.nomineeRelation ?? '');
        }
      } catch {
        // no existing KYC
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isApproved = kyc?.status === 'approved';
  const canSubmit = !isApproved;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const maxSizeBytes = 2 * 1024 * 1024;
      const selectedFiles = [
        { label: 'Aadhaar photo', file: aadhaarPhoto },
        { label: 'PAN photo', file: panPhoto },
        { label: 'Bank proof photo', file: bankProofPhoto },
      ];
      for (const item of selectedFiles) {
        if (item.file && item.file.size > maxSizeBytes) {
          throw new Error(`${item.label} must be 2MB or less`);
        }
      }

      const formData = new FormData();
      formData.append('aadhaarNumber', aadhaarNumber.trim());
      formData.append('panNumber', panNumber.trim());
      formData.append('bankAccountNumber', bankAccountNumber.trim());
      formData.append('ifscCode', ifscCode.trim());
      formData.append('bankName', bankName.trim());
      formData.append('branchName', branchName.trim());
      formData.append('nomineeName', nomineeName.trim());
      formData.append('nomineeRelation', nomineeRelation.trim());
      if (aadhaarPhoto) formData.append('aadhaarPhoto', aadhaarPhoto);
      if (panPhoto) formData.append('panPhoto', panPhoto);
      if (bankProofPhoto) formData.append('bankProofPhoto', bankProofPhoto);

      const res = await submitKyc(formData);
      setKyc(res.data);
      setSuccess('eKYC submitted successfully! It is now pending admin review.');
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to submit eKYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">eKYC Verification</h1>
          <p className="mt-1 text-slate-600">Submit your identity and bank documents for verification.</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[kyc?.status ?? 'none']}`}>
          {STATUS_LABELS[kyc?.status ?? 'none']}
        </span>
      </div>

      {kyc?.status === 'rejected' && kyc.adminRemarks && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Rejected: {kyc.adminRemarks}
        </div>
      )}

      {isApproved && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
          <p className="text-green-700 font-medium">Your eKYC has been approved. No further action needed.</p>
        </div>
      )}

      {canSubmit && (
        <form onSubmit={handleSubmit} className="mt-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-1 text-xs text-slate-500">Each document must be 2MB or less (JPEG, PNG, WebP, or PDF).</p>

            {/* 4-col responsive grid: 1 col mobile, 2 col sm, 4 col lg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4 mt-4">

              {/* Row 1: Aadhaar Number, Aadhaar Photo, PAN Number, PAN Photo */}
              <div>
                <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-slate-700">Aadhaar Number <span className="text-red-500">*</span></label>
                <input id="aadhaarNumber" type="text" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} required placeholder="1234 5678 9012" disabled={submitting} className={inputClass} />
              </div>
              <div>
                <label htmlFor="aadhaarPhoto" className="block text-sm font-medium text-slate-700">Aadhaar Photo {!kyc?.aadhaarPhoto && <span className="text-red-500">*</span>}</label>
                <input id="aadhaarPhoto" type="file" accept="image/*,.pdf" onChange={(e) => setAadhaarPhoto(e.target.files?.[0] ?? null)} required={!kyc?.aadhaarPhoto} disabled={submitting} className={fileClass} />
                {kyc?.aadhaarPhoto && <p className="mt-0.5 text-xs text-slate-400">Uploaded. Re-upload to replace.</p>}
              </div>
              <div>
                <label htmlFor="panNumber" className="block text-sm font-medium text-slate-700">PAN Number <span className="text-red-500">*</span></label>
                <input id="panNumber" type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} required placeholder="ABCDE1234F" disabled={submitting} className={inputClass} />
              </div>
              <div>
                <label htmlFor="panPhoto" className="block text-sm font-medium text-slate-700">PAN Photo {!kyc?.panPhoto && <span className="text-red-500">*</span>}</label>
                <input id="panPhoto" type="file" accept="image/*,.pdf" onChange={(e) => setPanPhoto(e.target.files?.[0] ?? null)} required={!kyc?.panPhoto} disabled={submitting} className={fileClass} />
                {kyc?.panPhoto && <p className="mt-0.5 text-xs text-slate-400">Uploaded. Re-upload to replace.</p>}
              </div>

              {/* Row 2: Bank Account, IFSC, Bank Name, Branch */}
              <div>
                <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-slate-700">Account Number <span className="text-red-500">*</span></label>
                <input id="bankAccountNumber" type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} required disabled={submitting} className={inputClass} />
              </div>
              <div>
                <label htmlFor="ifscCode" className="block text-sm font-medium text-slate-700">IFSC Code <span className="text-red-500">*</span></label>
                <input id="ifscCode" type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required placeholder="e.g. SBIN0001234" disabled={submitting} className={inputClass} />
              </div>
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-slate-700">Bank Name <span className="text-red-500">*</span></label>
                <input id="bankName" type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required disabled={submitting} className={inputClass} />
              </div>
              <div>
                <label htmlFor="branchName" className="block text-sm font-medium text-slate-700">Branch <span className="text-red-500">*</span></label>
                <input id="branchName" type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} required disabled={submitting} className={inputClass} />
              </div>

              {/* Row 3: Bank Proof, Nominee Name, Nominee Relation, Submit */}
              <div>
                <label htmlFor="bankProofPhoto" className="block text-sm font-medium text-slate-700">Bank Proof / Cheque {!kyc?.bankProofPhoto && <span className="text-red-500">*</span>}</label>
                <input id="bankProofPhoto" type="file" accept="image/*,.pdf" onChange={(e) => setBankProofPhoto(e.target.files?.[0] ?? null)} required={!kyc?.bankProofPhoto} disabled={submitting} className={fileClass} />
                {kyc?.bankProofPhoto && <p className="mt-0.5 text-xs text-slate-400">Uploaded. Re-upload to replace.</p>}
              </div>
              <div>
                <label htmlFor="nomineeName" className="block text-sm font-medium text-slate-700">Nominee Name <span className="text-red-500">*</span></label>
                <input id="nomineeName" type="text" value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} required disabled={submitting} className={inputClass} />
              </div>
              <div>
                <label htmlFor="nomineeRelation" className="block text-sm font-medium text-slate-700">Nominee Relation <span className="text-red-500">*</span></label>
                <select id="nomineeRelation" value={nomineeRelation} onChange={(e) => setNomineeRelation(e.target.value)} required disabled={submitting} className={inputClass}>
                  <option value="" disabled>Select relation</option>
                  <option value="Wife">Wife</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Husband">Husband</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : kyc ? 'Resubmit eKYC' : 'Submit eKYC'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
