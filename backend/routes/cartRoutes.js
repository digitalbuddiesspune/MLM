import { Router } from 'express';
import { addToCart, clearCart, getCart, removeFromCart } from '../controllers/cartController.js';
import { attachOptionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(attachOptionalAuth);
router.get('/', getCart);
router.post('/', addToCart);
router.delete('/', clearCart);
router.delete('/:productId', removeFromCart);

export default router;
