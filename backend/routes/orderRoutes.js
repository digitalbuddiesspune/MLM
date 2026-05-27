import { Router } from 'express';
import {
  createOrder,
  verifyOrderPayment,
  createCartCheckout,
  verifyCartCheckout,
  getMyOrders,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createOrder);
router.post('/verify', requireAuth, verifyOrderPayment);
router.post('/cart-checkout', requireAuth, createCartCheckout);
router.post('/cart-verify', requireAuth, verifyCartCheckout);
router.get('/my', requireAuth, getMyOrders);

export default router;
