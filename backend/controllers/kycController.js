import { submitKyc, getKycByUserId, listKycSubmissions, reviewKyc } from '../services/kycService.js';
import { uploadFileToCloudinary } from '../services/cloudinaryService.js';

/**
 * POST /api/kyc/submit
 * Multipart form: aadhaarPhoto, panPhoto, bankProofPhoto + text fields.
 */
export async function submitKycHandler(req, res, next) {
  try {
    const userId = req.userId;
    const {
      aadhaarNumber, panNumber, bankAccountNumber,
      ifscCode, bankName, branchName, nomineeName, nomineeRelation,
    } = req.body;

    const aadhaarFile = req.files?.aadhaarPhoto?.[0] ?? null;
    const panFile = req.files?.panPhoto?.[0] ?? null;
    const bankProofFile = req.files?.bankProofPhoto?.[0] ?? null;

    const photoPaths = {
      aadhaarPhoto: '',
      panPhoto: '',
      bankProofPhoto: '',
    };

    if (aadhaarFile) {
      const uploaded = await uploadFileToCloudinary(aadhaarFile, 'mlm/kyc/aadhaar');
      photoPaths.aadhaarPhoto = uploaded.secureUrl;
    }
    if (panFile) {
      const uploaded = await uploadFileToCloudinary(panFile, 'mlm/kyc/pan');
      photoPaths.panPhoto = uploaded.secureUrl;
    }
    if (bankProofFile) {
      const uploaded = await uploadFileToCloudinary(bankProofFile, 'mlm/kyc/bank-proof');
      photoPaths.bankProofPhoto = uploaded.secureUrl;
    }

    const kyc = await submitKyc(
      userId,
      { aadhaarNumber, panNumber, bankAccountNumber, ifscCode, bankName, branchName, nomineeName, nomineeRelation },
      photoPaths
    );

    res.status(201).json({ success: true, data: kyc });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/kyc/me
 * Returns logged-in user's KYC document.
 */
export async function getMyKyc(req, res, next) {
  try {
    const kyc = await getKycByUserId(req.userId);
    res.json({ success: true, data: kyc });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/kyc?status=pending&page=1&limit=10
 */
export async function listKycHandler(req, res, next) {
  try {
    const status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const result = await listKycSubmissions({ status, page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/kyc/:id
 * Body: { decision: 'approved' | 'rejected', remarks?: string }
 */
export async function reviewKycHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { decision, remarks } = req.body;
    const kyc = await reviewKyc(id, decision, req.userId, remarks);
    res.json({ success: true, data: kyc });
  } catch (error) {
    next(error);
  }
}
