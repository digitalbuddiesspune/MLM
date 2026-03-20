import { Router } from 'express';
import { submitKycHandler, getMyKyc } from '../controllers/kycController.js';
import { requireAuth } from '../middleware/auth.js';
import { kycUpload } from '../middleware/upload.js';

const router = Router();

router.get('/me', requireAuth, getMyKyc);

router.post(
  '/submit',
  requireAuth,
  kycUpload.fields([
    { name: 'aadhaarPhoto', maxCount: 1 },
    { name: 'panPhoto', maxCount: 1 },
    { name: 'bankProofPhoto', maxCount: 1 },
  ]),
  submitKycHandler
);

export default router;
