import rateLimit from 'express-rate-limit';

export const authRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 80),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again shortly.' },
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.REGISTER_RATE_LIMIT_MAX ?? 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Registration rate limit exceeded.' },
});

export const sensitiveMutationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.MUTATION_RATE_LIMIT_MAX ?? 50),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many mutations. Slow down.' },
});
