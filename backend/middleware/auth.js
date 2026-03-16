import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';

/**
 * Verifies JWT and attaches req.userId. Calls next() on success.
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

/**
 * Requires auth and role === 'admin'. Attaches req.userId.
 */
export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    req.userId = userId;
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
  User.findById(req.userId)
    .select('role')
    .lean()
    .then((user) => {
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      next();
    })
    .catch(next);
}
