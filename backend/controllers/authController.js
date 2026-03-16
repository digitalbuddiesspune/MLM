import jwt from 'jsonwebtoken';
import { register as registerUser, login as loginUser } from '../services/userService.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

/**
 * POST /api/auth/register
 * Body: { name, email, password, sponsorId? }
 */
export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);
    const token = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res, next) {
  try {
    const user = await loginUser(req.body);
    const token = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.status(200).json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
}
