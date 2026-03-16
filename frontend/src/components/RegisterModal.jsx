import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as registerApi, setAuth, getDashboardPathForRole } from '../api/auth.js';

export default function RegisterModal({ onClose, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await registerApi({
        name: name.trim(),
        email: email.trim(),
        password,
        sponsorId: sponsorId.trim() || null,
        panNumber: panNumber.trim() || '',
        bankAccountNumber: bankAccountNumber.trim() || '',
        upiId: upiId.trim() || '',
      });
      const { token, user } = response.data;
      setAuth(token, user);
      onClose();
      navigate(getDashboardPathForRole(user?.role), { replace: true });
    } catch (err) {
      const message = err.response?.data?.error ?? err.message ?? 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Register</h2>
        <p className="mt-1 text-slate-600">Create your account to join the network.</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label htmlFor="modal-name" className="block text-sm font-medium text-slate-700">Full name <span className="text-red-500">*</span></label>
            <input
              id="modal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="modal-reg-email" className="block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
            <input
              id="modal-reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="modal-reg-password" className="block text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
            <input
              id="modal-reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="modal-sponsorId" className="block text-sm font-medium text-slate-700">Sponsor ID <span className="text-red-500">*</span></label>
            <input
              id="modal-sponsorId"
              type="text"
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              required
              placeholder="Enter sponsor's ID"
              disabled={loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="modal-pan" className="block text-sm font-medium text-slate-700">PAN number <span className="text-red-500">*</span></label>
            <input
              id="modal-pan"
              type="text"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              required
              placeholder="e.g. ABCDE1234F"
              disabled={loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="modal-bank" className="block text-sm font-medium text-slate-700">Bank account number <span className="text-red-500">*</span></label>
            <input
              id="modal-bank"
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              required
              placeholder="Bank account number"
              disabled={loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="modal-upi" className="block text-sm font-medium text-slate-700">UPI ID <span className="text-red-500">*</span></label>
            <input
              id="modal-upi"
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
              placeholder="e.g. name@upi"
              disabled={loading}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => { onClose(); onSwitchToLogin(); }}
            className="font-medium text-teal-600 hover:text-teal-700"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
