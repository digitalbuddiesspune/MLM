import { Router } from 'express';
import { getMyTeam, getBinaryTree, getReferralTree } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/team', requireAuth, getMyTeam);
router.get('/binary-tree', requireAuth, getBinaryTree);
router.get('/referral-tree', requireAuth, getReferralTree);

export default router;
