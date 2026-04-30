import { Router } from 'express';
import {
  getMyTeam,
  getMyProfile,
  getBinaryTree,
  getReferralTree,
  getMyWallet,
  getMyTransactions,
  getMyWithdrawalInfo,
  createWithdrawalRequest,
} from '../controllers/userController.js';
import { createMyAddress, detectAddressState, getMyAddresses } from '../controllers/addressController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/team', requireAuth, getMyTeam);
router.get('/profile', requireAuth, getMyProfile);
router.get('/binary-tree', requireAuth, getBinaryTree);
router.get('/referral-tree', requireAuth, getReferralTree);
router.get('/wallet', requireAuth, getMyWallet);
router.get('/transactions', requireAuth, getMyTransactions);
router.get('/withdrawal-info', requireAuth, getMyWithdrawalInfo);
router.post('/withdrawal-request', requireAuth, createWithdrawalRequest);
router.get('/addresses', requireAuth, getMyAddresses);
router.post('/addresses', requireAuth, createMyAddress);
router.get('/addresses/detect-state', requireAuth, detectAddressState);

export default router;
