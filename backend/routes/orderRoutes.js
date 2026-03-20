import { Router } from 'express';
import { createOrder, verifyOrderPayment, getMyOrders } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createOrder);
router.post('/verify', requireAuth, verifyOrderPayment);
router.get('/my', requireAuth, getMyOrders);

export default router;
