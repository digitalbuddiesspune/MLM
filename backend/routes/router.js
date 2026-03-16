import { Router } from 'express';
import authRoutes from './authRoutes.js';
import activationRoutes from './activationRoutes.js';
import adminRoutes from './adminRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/activation', activationRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/products', productRoutes);

export default router;
