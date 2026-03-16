import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { register as registerApi, setAuth, getDashboardPathForRole } from '../api/auth.js';

export default function Register() {
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get('ref') ?? '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sponsorId, setSponsorId] = useState(refFromUrl);
  const navigate = useNavigate();

  useEffect(() => {
    if (refFromUrl) setSponsorId(refFromUrl);
  }, [refFromUrl]);
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      navigate(getDashboardPathForRole(user?.role), { replace: true });
    } catch (err) {
      const message = err.response?.data?.error ?? err.message ?? 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Register</h1>
          <p className="mt-1 text-slate-600">Create your account to join the network.</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full name <span className="text-red-500">*</span></label>
              <input
                id="name"
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
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
              <input
                id="email"
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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
              <input
                id="password"
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
              <label htmlFor="sponsorId" className="block text-sm font-medium text-slate-700">Sponsor ID <span className="text-red-500">*</span></label>
              <input
                id="sponsorId"
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
              <label htmlFor="pan" className="block text-sm font-medium text-slate-700">PAN number <span className="text-red-500">*</span></label>
              <input
                id="pan"
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
              <label htmlFor="bank" className="block text-sm font-medium text-slate-700">Bank account number <span className="text-red-500">*</span></label>
              <input
                id="bank"
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
              <label htmlFor="upi" className="block text-sm font-medium text-slate-700">UPI ID <span className="text-red-500">*</span></label>
              <input
                id="upi"
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
            <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700">
              Login
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
