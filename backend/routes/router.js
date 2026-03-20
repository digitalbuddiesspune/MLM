import { Router } from 'express';
import authRoutes from './authRoutes.js';
import activationRoutes from './activationRoutes.js';
import adminRoutes from './adminRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import kycRoutes from './kycRoutes.js';
import orderRoutes from './orderRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/activation', activationRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/products', productRoutes);
router.use('/kyc', kycRoutes);
router.use('/orders', orderRoutes);

export default router;
