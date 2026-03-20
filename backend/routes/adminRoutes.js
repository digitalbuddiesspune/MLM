import { Router } from 'express';
import { getStats, getUsers, updateUser, deleteUser } from '../controllers/adminController.js';
import { listKycHandler, reviewKycHandler } from '../controllers/kycController.js';
import { createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { getAdminOrders } from '../controllers/orderController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAuth, requireAdmin, getStats);
router.get('/users', requireAuth, requireAdmin, getUsers);
router.patch('/users/:id', requireAuth, requireAdmin, updateUser);
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

// KYC management
router.get('/kyc', requireAuth, requireAdmin, listKycHandler);
router.patch('/kyc/:id', requireAuth, requireAdmin, reviewKycHandler);

// Product management
router.post('/products', requireAuth, requireAdmin, createProduct);
router.patch('/products/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/products/:id', requireAuth, requireAdmin, deleteProduct);
router.get('/orders', requireAuth, requireAdmin, getAdminOrders);

export default router;
