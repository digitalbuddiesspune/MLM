import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { authRouteLimiter, registrationLimiter } from '../middleware/rateLimiter.js';
import { validateLoginBody, validateRegisterBody } from '../middleware/registerValidation.js';

const router = Router();

router.post('/register', registrationLimiter, validateRegisterBody, register);
router.post('/login', authRouteLimiter, validateLoginBody, login);

export default router;
