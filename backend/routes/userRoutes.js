import { Router } from 'express';
import {
  getMyTeam,
  getBinaryTree,
  getReferralTree,
  getMyWallet,
  getMyTransactions,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/team', requireAuth, getMyTeam);
router.get('/binary-tree', requireAuth, getBinaryTree);
router.get('/referral-tree', requireAuth, getReferralTree);
router.get('/wallet', requireAuth, getMyWallet);
router.get('/transactions', requireAuth, getMyTransactions);

export default router;
