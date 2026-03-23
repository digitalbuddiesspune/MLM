import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getStoredUser } from '../api/auth.js';

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

const TeamIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

const LevelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </svg>
);

const LevelItemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const sidebarLinks = [
  { to: '/user/my-plan', label: 'My Plan', icon: '🛍️' },
  { to: '/user/ekyc', label: 'eKYC', icon: '📋' },
  { to: '/user/team', label: 'My Team', icon: <TeamIcon /> },
  { to: '/user/binary-tree', label: 'Binary Tree', icon: '🌳' },
  { to: '/user/wallet', label: 'Wallet', icon: '💰' },
  { to: '/user/income-report', label: 'Income Report', icon: '📈' },
  { to: '/user/rank', label: 'Rank', icon: '⭐' },
  { to: '/user/rewards', label: 'Rewards', icon: '🏆' },
  { to: '/user/renewal', label: 'Renewal', icon: '🔄' },
];

const levelDropdownLinks = [
  { to: '/user/level/my-hierarchy', label: 'My Hierarchy' },
  { to: '/user/level/my-user-list', label: 'My User List' },
  { to: '/user/level/my-direct', label: 'My Direct' },
  { to: '/user/level/all-hierarchy', label: 'All Hierarchy' },
];

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [levelOpen, setLevelOpen] = useState(location.pathname.startsWith('/user/level'));

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    setSidebarOpen(false);
    setProfileOpen(false);
    clearAuth();
    navigate('/login');
  };

  const user = getStoredUser();
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <div className="flex min-h-[calc(100vh-0px)] bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-start border-r border-purple-800 bg-purple-700 transition-all duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0 w-64 lg:w-64' : '-translate-x-full lg:translate-x-0 w-64 lg:w-16'
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-purple-600 px-2 transition-[padding] duration-200 ${sidebarOpen ? 'justify-between px-4 lg:justify-start lg:px-5' : 'justify-center lg:justify-center lg:px-0'}`}>
          <Link to="/user/dashboard" className="flex items-center gap-2 font-semibold text-white lg:justify-start">
            <img
              src="/amruta-wellness-logo.png"
              alt="Amruta Wellness"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <span className={sidebarOpen ? '' : 'hidden'}>Amruta Wellness</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-purple-200 hover:bg-purple-600 lg:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-auto p-2 pb-4 lg:px-2">
          <Link
            to="/user/dashboard"
            title={!sidebarOpen ? 'Dashboard' : undefined}
            className={`flex items-start rounded-lg px-2 py-2.5 text-sm font-medium transition-colors lg:justify-start ${
              sidebarOpen ? 'gap-3 px-3 items-center' : 'lg:px-2'
            } ${
              isActive('/user/dashboard')
                ? 'bg-purple-600 text-white'
                : 'text-purple-100 hover:bg-purple-600/50 hover:text-white'
            }`}
          >
            <span className="flex shrink-0 text-lg [&>svg]:size-5" aria-hidden><DashboardIcon /></span>
            <span className={sidebarOpen ? '' : 'hidden'}>Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => setLevelOpen((prev) => !prev)}
            className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium transition-colors ${
              sidebarOpen ? 'gap-3 px-3' : 'lg:px-2'
            } ${
              location.pathname.startsWith('/user/level')
                ? 'bg-purple-600 text-white'
                : 'text-purple-100 hover:bg-purple-600/50 hover:text-white'
            }`}
          >
            <span className="flex shrink-0 text-lg [&>svg]:size-5" aria-hidden><LevelIcon /></span>
            <span className={sidebarOpen ? '' : 'hidden'}>Level</span>
            <span className={`ml-auto transition-transform ${levelOpen ? 'rotate-180' : ''} ${sidebarOpen ? '' : 'hidden'}`}>▾</span>
          </button>
          {levelOpen && (
            <div className={`${sidebarOpen ? 'ml-8' : 'ml-0'} space-y-0.5`}>
              {levelDropdownLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive(item.to)
                      ? 'bg-purple-500 text-white'
                      : 'text-purple-100 hover:bg-purple-600/40 hover:text-white'
                  } ${sidebarOpen ? '' : 'hidden'}`}
                >
                  <span className="flex shrink-0 [&>svg]:size-4" aria-hidden><LevelItemIcon /></span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          {sidebarLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              title={!sidebarOpen ? label : undefined}
              className={`flex items-start rounded-lg px-2 py-2.5 text-sm font-medium transition-colors lg:justify-start ${
                sidebarOpen ? 'gap-3 px-3 items-center' : 'lg:px-2'
              } ${
                isActive(to)
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-100 hover:bg-purple-600/50 hover:text-white'
              }`}
            >
              <span className="flex shrink-0 text-lg [&>svg]:size-5" aria-hidden>{icon}</span>
              <span className={sidebarOpen ? '' : 'hidden'}>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto shrink-0 space-y-1 border-t border-purple-600 p-2 lg:px-2">
          <Link
            to="/"
            title="Visit Site"
            className={`flex w-full items-start rounded-lg px-2 py-2.5 text-left text-sm font-medium text-purple-100 transition-colors hover:bg-purple-600/50 hover:text-white lg:justify-start ${sidebarOpen ? 'gap-3 px-3 items-center' : 'lg:px-2'}`}
          >
            <span className="flex shrink-0 text-lg [&>svg]:size-5" aria-hidden>🌐</span>
            <span className={sidebarOpen ? '' : 'hidden'}>Visit Site</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`flex w-full items-start rounded-lg px-2 py-2.5 text-left text-sm font-medium text-purple-100 transition-colors hover:bg-purple-600/50 hover:text-red-200 lg:justify-start ${sidebarOpen ? 'gap-3 px-3 items-center' : 'lg:px-2'}`}
          >
            <span className="flex shrink-0 text-lg [&>svg]:size-5" aria-hidden><LogoutIcon /></span>
            <span className={sidebarOpen ? '' : 'hidden'}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content + Top bar */}
      <div className={`flex flex-1 flex-col lg:min-w-0 transition-[margin] duration-200 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wallet balance */}
            <Link
              to="/user/wallet"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <span className="text-slate-500">₹</span>
              <span>0</span>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setNotificationsOpen((o) => !o); setProfileOpen(false); }}
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Notifications"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-teal-500" aria-hidden />
              </button>
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                    <p className="px-4 py-3 text-sm font-medium text-slate-700">Notifications</p>
                    <p className="px-4 py-4 text-center text-sm text-slate-500">No new notifications.</p>
                  </div>
                </>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setProfileOpen((o) => !o); setNotificationsOpen(false); }}
                className="flex items-center gap-2 rounded-lg p-1.5 pr-2 text-slate-700 hover:bg-slate-100"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                  {userInitial}
                </span>
                <span className="hidden text-sm font-medium sm:inline">{user?.name ?? 'Profile'}</span>
                <svg className={`h-4 w-4 text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <Link
                      to="/user/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Back to site
                    </Link>
                    <hr className="my-1 border-slate-100" />
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
