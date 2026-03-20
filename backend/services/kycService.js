import mongoose from 'mongoose';
import Kyc from '../models/Kyc.js';
import User from '../models/User.js';

/**
 * Submit eKYC documents for a user.
 * @param {string} userId
 * @param {Object} fields - Text fields (aadhaarNumber, panNumber, bankAccountNumber, ifscCode, bankName, branchName, nomineeName, nomineeRelation)
 * @param {{ aadhaarPhoto?: string, panPhoto?: string, bankProofPhoto?: string }} photoPaths - Cloudinary URLs from uploads
 * @returns {Promise<Object>} Created/updated KYC document
 */
export async function submitKyc(userId, fields, photoPaths) {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    const err = new Error('Valid userId is required');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId).select('kycStatus').lean();
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.kycStatus === 'approved') {
    const err = new Error('KYC is already approved');
    err.statusCode = 409;
    throw err;
  }

  const requiredTextFields = [
    'aadhaarNumber', 'panNumber', 'bankAccountNumber',
    'ifscCode', 'bankName', 'branchName', 'nomineeName', 'nomineeRelation',
  ];
  for (const field of requiredTextFields) {
    if (!fields[field]?.trim()) {
      const err = new Error(`${field} is required`);
      err.statusCode = 400;
      throw err;
    }
  }
  const existingKyc = await Kyc.findOne({ userId }).lean();
  const normalizedPhotoPaths = {
    aadhaarPhoto: photoPaths?.aadhaarPhoto || existingKyc?.aadhaarPhoto || '',
    panPhoto: photoPaths?.panPhoto || existingKyc?.panPhoto || '',
    bankProofPhoto: photoPaths?.bankProofPhoto || existingKyc?.bankProofPhoto || '',
  };

  if (!normalizedPhotoPaths.aadhaarPhoto) {
    const err = new Error('Aadhaar photo is required');
    err.statusCode = 400;
    throw err;
  }
  if (!normalizedPhotoPaths.panPhoto) {
    const err = new Error('PAN photo is required');
    err.statusCode = 400;
    throw err;
  }
  if (!normalizedPhotoPaths.bankProofPhoto) {
    const err = new Error('Bank proof photo or cheque is required');
    err.statusCode = 400;
    throw err;
  }

  if (existingKyc) {
    const updated = await Kyc.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...fields,
          ...normalizedPhotoPaths,
          status: 'pending',
          adminRemarks: '',
          reviewedBy: null,
          reviewedAt: null,
        },
      },
      { new: true }
    ).lean();
    await User.findByIdAndUpdate(userId, { $set: { kycStatus: 'pending' } });
    return updated;
  }

  const [kyc] = await Kyc.create([
    {
      userId,
      ...fields,
      ...normalizedPhotoPaths,
      status: 'pending',
    },
  ]);
  await User.findByIdAndUpdate(userId, { $set: { kycStatus: 'pending' } });
  return kyc.toObject();
}

/**
 * Get KYC record for a user.
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function getKycByUserId(userId) {
  return Kyc.findOne({ userId }).lean();
}

/**
 * Admin: list KYC submissions with optional status filter.
 * @param {{ status?: string, page?: number, limit?: number }} opts
 * @returns {Promise<{ submissions: Object[], pagination: Object }>}
 */
export async function listKycSubmissions({ status, page = 1, limit = 10 } = {}) {
  const filter = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    Kyc.find(filter)
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Kyc.countDocuments(filter),
  ]);

  return {
    submissions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Admin: approve or reject a KYC submission.
 * @param {string} kycId
 * @param {'approved' | 'rejected'} decision
 * @param {string} adminId
 * @param {string} [remarks='']
 * @returns {Promise<Object>} Updated KYC
 */
export async function reviewKyc(kycId, decision, adminId, remarks = '') {
  if (!['approved', 'rejected'].includes(decision)) {
    const err = new Error('Decision must be approved or rejected');
    err.statusCode = 400;
    throw err;
  }

  const kyc = await Kyc.findById(kycId);
  if (!kyc) {
    const err = new Error('KYC submission not found');
    err.statusCode = 404;
    throw err;
  }

  kyc.status = decision;
  kyc.adminRemarks = remarks;
  kyc.reviewedBy = adminId;
  kyc.reviewedAt = new Date();
  await kyc.save();

  await User.findByIdAndUpdate(kyc.userId, {
    $set: {
      kycStatus: decision,
      isApproved: decision === 'approved',
    },
  });

  return kyc.toObject();
}
