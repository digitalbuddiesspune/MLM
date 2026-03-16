import { Router } from 'express';
import { getStats, getUsers, updateUser, deleteUser } from '../controllers/adminController.js';
import { createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAuth, requireAdmin, getStats);
router.get('/users', requireAuth, requireAdmin, getUsers);
router.patch('/users/:id', requireAuth, requireAdmin, updateUser);
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

// Product management
router.post('/products', requireAuth, requireAdmin, createProduct);
router.patch('/products/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/products/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
