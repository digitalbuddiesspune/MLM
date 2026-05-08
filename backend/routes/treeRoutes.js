import { Router } from 'express';
import {
  postPlace,
  postManualPlace,
  postDragDrop,
  getTree,
  getDownline,
  getPairs,
  getIncome,
} from '../controllers/treeController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { sensitiveMutationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/* Mutations: admin-only (validators inside the services prevent self-parenting / cycles). */
router.post('/place', sensitiveMutationLimiter, requireAuth, requireAdmin, postPlace);
router.post('/manual-place', sensitiveMutationLimiter, requireAuth, requireAdmin, postManualPlace);
router.post('/drag-drop', sensitiveMutationLimiter, requireAuth, requireAdmin, postDragDrop);

/* Reads: any authenticated user can fetch their own subtree / pair / income summaries. */
router.get('/downline', requireAuth, getDownline);
router.get('/downline/:id', requireAuth, getDownline);
router.get('/pairs', requireAuth, getPairs);
router.get('/pairs/:id', requireAuth, getPairs);
router.get('/income', requireAuth, getIncome);
router.get('/income/:id', requireAuth, getIncome);
router.get('/:id', requireAuth, getTree);

export default router;
