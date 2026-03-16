import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthModalContext } from '../context/AuthModalContext.jsx';
import Navbar from './Navbar';
import Footer from './Footer';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

export default function Layout() {
  const [authModal, setAuthModal] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state;
    if (state?.authModal) {
      setAuthModal(state.authModal);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const authModalValue = {
    openLogin: () => setAuthModal('login'),
    openRegister: () => setAuthModal('register'),
  };

  const isDashboardRoute = /^\/(user|admin)(\/|$)/.test(location.pathname);
  const isHomePage = location.pathname === '/';

  return (
    <AuthModalContext.Provider value={authModalValue}>
    <div className="flex min-h-screen flex-col bg-white">
      {!isDashboardRoute && !isHomePage && (
        <Navbar
          onOpenLogin={() => setAuthModal('login')}
          onOpenRegister={() => setAuthModal('register')}
        />
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isDashboardRoute && <Footer />}
      {authModal === 'login' && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSwitchToRegister={() => setAuthModal('register')}
        />
      )}
      {authModal === 'register' && (
        <RegisterModal
          onClose={() => setAuthModal(null)}
          onSwitchToLogin={() => setAuthModal('login')}
        />
      )}
    </div>
    </AuthModalContext.Provider>
  );
}
