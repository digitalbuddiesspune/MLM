import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, isAuthenticated, getDashboardPathForRole } from '../api/auth.js';

/**
 * Protects routes by role. Redirects to login if not authenticated,
 * or to the correct dashboard if the user's role is not allowed.
 * @param {{ children: React.ReactNode, allowedRoles: string[] }} props
 */
export default function RequireRole({ children, allowedRoles }) {
  const location = useLocation();
  const user = getStoredUser();
  const role = user?.role ?? 'user';

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPathForRole(role)} replace />;
  }

  return children;
}
