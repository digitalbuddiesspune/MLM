import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuth, getStoredUser } from '../../api/auth.js';
import { changeMyPassword } from '../../api/user.js';

function SettingsCard({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    try {
      setPwSubmitting(true);
      await changeMyPassword({ currentPassword, newPassword });
      setPwMessage('Password updated successfully. Use the new password next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err?.response?.data?.error ?? 'Could not update password.');
    } finally {
      setPwSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-600">Account and admin shortcuts.</p>
        {user && (
          <p className="mt-2 text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-800">{user.name ?? user.email}</span>
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard
          title="Security"
          description="Update the password for this admin account (applies everywhere you log in with this email)."
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwMessage && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{pwMessage}</div>
            )}
            {pwError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwError}</div>
            )}
            <div>
              <label htmlFor="settings-current-password" className="block text-xs font-medium text-slate-700">
                Current password
              </label>
              <input
                id="settings-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="settings-new-password" className="block text-xs font-medium text-slate-700">
                New password
              </label>
              <input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500">At least 6 characters.</p>
            </div>
            <div>
              <label htmlFor="settings-confirm-password" className="block text-xs font-medium text-slate-700">
                Confirm new password
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={pwSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {pwSubmitting ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Forgot password"
          description="There is no email-based reset yet. While you are logged in, use “Change password” on the left. If you are completely locked out, ask another admin to update your account or reset it from the database / seed script."
        >
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
            <li>
              Still logged in? Use <strong>Security → Update password</strong> above — you only need your current password.
            </li>
            <li>
              Logged out and forgot the password? Use the public site login, then{' '}
              <strong>contact another administrator</strong> or restore access via your deployment procedure (MongoDB /{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">npm run seed</code> only affects the seeded admin email).
            </li>
          </ul>
          <div className="mt-4">
            <Link
              to="/"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Open public site →
            </Link>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Quick links"
          description="Jump to common admin pages."
        >
          <nav className="flex flex-col gap-2 text-sm">
            <Link to="/admin/dashboard" className="font-medium text-indigo-600 hover:text-indigo-800">
              Dashboard
            </Link>
            <Link to="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-800">
              Users
            </Link>
            <Link to="/admin/kyc-approvals" className="font-medium text-indigo-600 hover:text-indigo-800">
              KYC approvals
            </Link>
            <Link to="/admin/orders" className="font-medium text-indigo-600 hover:text-indigo-800">
              Orders
            </Link>
            <Link to="/admin/products" className="font-medium text-indigo-600 hover:text-indigo-800">
              Products
            </Link>
            <Link to="/admin/payouts" className="font-medium text-indigo-600 hover:text-indigo-800">
              Payouts
            </Link>
          </nav>
        </SettingsCard>

        <SettingsCard
          title="Session"
          description="Sign out on this browser. Your session is stored locally until you log out or clear site data."
        >
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Sign out
          </button>
        </SettingsCard>
      </div>
    </div>
  );
}
