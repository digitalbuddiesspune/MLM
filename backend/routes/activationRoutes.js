import { Router } from 'express';
import { activate, getActivationAmount } from '../controllers/activationController.js';

const router = Router();

router.get('/amount', getActivationAmount);
router.post('/', activate);

export default router;
