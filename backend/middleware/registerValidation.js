/**
 * Lightweight body validation — keeps dependencies minimal vs express-validator chains.
 */

function hasValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function validateRegisterBody(req, res, next) {
  const { name, mobile, email, password, sponsorId } = req.body ?? {};
  const errors = [];

  if (typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name must be at least 2 characters');
  }
  if (typeof mobile !== 'string' || mobile.trim().length < 10) {
    errors.push('mobile must be valid');
  }
  if (!hasValidEmail(email ?? '')) {
    errors.push('email must be a valid address');
  }
  if (typeof password !== 'string' || password.length < 6) {
    errors.push('password must be at least 6 characters');
  }
  if (typeof sponsorId !== 'string' || sponsorId.trim() === '' || !/^\d+$/.test(String(sponsorId).trim())) {
    errors.push('sponsorId (numeric referral code) is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join('; ') });
  }

  req.body.email = email.trim().toLowerCase();
  req.body.mobile = mobile.trim();
  req.body.name = name.trim();
  next();
}

export function validateLoginBody(req, res, next) {
  const { email, password } = req.body ?? {};
  if (!hasValidEmail(email ?? '') || typeof password !== 'string' || !password.length) {
    return res.status(400).json({ success: false, error: 'Valid email and password are required' });
  }
  req.body.email = email.trim().toLowerCase();
  next();
}
