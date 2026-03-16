import { Link } from 'react-router-dom';
import { useAuthModal } from '../context/AuthModalContext.jsx';

const footerLinks = {
  company: [
    { to: '/#about', label: 'About Us' },
    { to: '/#business-plan', label: 'Business Plan' },
    { to: '/#contact', label: 'Contact' },
  ],
  products: [
    { to: '/#products', label: 'Our Products' },
  ],
};

export default function Footer() {
  const { openLogin, openRegister } = useAuthModal();
  return (
    <footer className="border-t border-teal-100 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 font-semibold text-teal-700">
              <img
                src="/amruta-wellness-logo.png"
                alt="Amruta Wellness"
                className="h-20 w-20 object-contain"
              />
            
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-600">
              Trusted wellness and healthcare solutions for a healthier tomorrow.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Company</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-600 hover:text-teal-600">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Products</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.products.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-600 hover:text-teal-600">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Account</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <button type="button" onClick={openLogin} className="text-left text-sm text-slate-600 hover:text-teal-600">
                  Login
                </button>
              </li>
              <li>
                <button type="button" onClick={openRegister} className="text-left text-sm text-slate-600 hover:text-teal-600">
                  Register
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Amruta Wellness. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
