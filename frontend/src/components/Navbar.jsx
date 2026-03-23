import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated, getStoredUser, getDashboardPathForRole } from '../api/auth.js';

export default function Navbar({ onOpenLogin, onOpenRegister, transparent = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerClass = transparent
    ? 'sticky top-0 z-50 bg-transparent border-none'
    : 'sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-teal-100';
  const linkClass = transparent
    ? 'flex items-center gap-2 font-semibold text-white hover:text-slate-200'
    : 'flex items-center gap-2 font-semibold text-teal-700';
  const dashClass = transparent
    ? 'rounded-lg px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white'
    : 'rounded-lg px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50';
  const loginClass = transparent
    ? 'rounded-lg px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white'
    : 'rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-teal-600';
  const registerClass = transparent
    ? 'rounded-lg bg-white/20 backdrop-blur px-4 py-2 text-sm font-medium text-white border border-white/40 hover:bg-white/30'
    : 'rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700';
  const menuBtnClass = transparent
    ? 'flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden'
    : 'flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden';

  return (
    <header className={headerClass}>
      <nav className="flex justify-between max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-2">
        <Link to="/" className={linkClass}>
          <img
            src="/amruta-wellness-logo.png"
            alt="Amruta Wellness"
            className={transparent ? 'h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain' : 'h-24 w-24 object-contain'}
          />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated() ? (
            <Link
              to={getDashboardPathForRole(getStoredUser()?.role)}
              className={dashClass}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { onOpenLogin?.(); }}
                className={loginClass}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { onOpenRegister?.(); }}
                className={registerClass}
              >
                Register
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className={menuBtnClass}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className={`border-t px-4 py-3 md:hidden ${transparent ? 'border-white/20 bg-slate-900/90 backdrop-blur' : 'border-teal-100 bg-white'}`}>
          <ul className="flex flex-col gap-1">
            <li className={`pb-2 ${transparent ? 'border-b border-white/10' : 'border-b border-slate-100'}`}>
              {isAuthenticated() ? (
                <Link
                  to={getDashboardPathForRole(getStoredUser()?.role)}
                  onClick={() => setMobileOpen(false)}
                  className={transparent ? 'block rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-white/10' : 'block rounded-lg px-3 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50'}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); onOpenLogin?.(); }}
                    className={transparent ? 'block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white hover:bg-white/10' : 'block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50'}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); onOpenRegister?.(); }}
                    className={transparent ? 'block w-full rounded-lg bg-white/20 px-3 py-2 text-left text-sm font-medium text-white border border-white/40' : 'block w-full rounded-lg bg-teal-600 px-3 py-2 text-left text-sm font-medium text-white'}
                  >
                    Register
                  </button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
