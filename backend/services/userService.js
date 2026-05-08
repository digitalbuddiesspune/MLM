import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { placeUserUnderSponsor } from './placementService.js';
import { applySponsorJoinEffects, autoActivateEligibleUplines } from './levelService.js';
import { nextReferralNumber, ensureReferralNumber, FIRST_REFERRAL_NUMBER } from './referralNumberService.js';

const SALT_ROUNDS = 10;

async function resolveSponsorMongoId(sponsorInput, session) {
  const s = String(sponsorInput ?? '').trim();
  if (!s) {
    const err = new Error('Sponsor ID is required');
    err.statusCode = 400;
    throw err;
  }

  if (!/^\d+$/.test(s)) {
    const err = new Error('Sponsor code must be numbers only');
    err.statusCode = 400;
    throw err;
  }

  const num = Number(s);
  if (!Number.isSafeInteger(num) || num < FIRST_REFERRAL_NUMBER) {
    const err = new Error('Invalid sponsor referral code');
    err.statusCode = 400;
    throw err;
  }

  const q = User.findOne({ referralNumber: num }).select('_id');
  const sponsor = session ? await q.session(session).lean() : await q.lean();

  if (!sponsor) {
    const err = new Error('Sponsor not found');
    err.statusCode = 404;
    throw err;
  }

  return String(sponsor._id);
}

/**
 * Registers a new user with minimal fields.
 * If sponsorId is provided, places them in the binary tree under sponsor.
 * Sponsor must be specified as numeric referralNumber (digits only).
 * @param {{ name: string, mobile: string, email: string, password: string, sponsorId?: string }} payload
 * @returns {Promise<Object>} Created user (password excluded)
 */
export async function register(payload) {
  const { name, mobile, email, password, sponsorId } = payload;

  if (!name?.trim()) {
    const err = new Error('Full name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!mobile?.trim()) {
    const err = new Error('Mobile number is required');
    err.statusCode = 400;
    throw err;
  }

  const existing = await User.findOne({ email: email?.toLowerCase() }).select('_id').lean();
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const sponsorCode = String(sponsorId ?? '').trim();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const normalizedSponsorId = await resolveSponsorMongoId(sponsorCode, session);
    const referralNumber = await nextReferralNumber(session);

    const [createdUser] = await User.create(
      [
        {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email?.toLowerCase().trim(),
          password: hashedPassword,
          referralNumber,
        },
      ],
      { session }
    );

    /* Sponsor-centric placement: append directly under sponsor, fill-left-first. */
    const placementResult = await placeUserUnderSponsor({
      userId: createdUser._id,
      sponsorId: normalizedSponsorId,
      preferredSide: null,
      manualPlacement: false,
      session,
      actorUserId: createdUser._id,
      reason: 'self-registration',
    });

    await applySponsorJoinEffects(normalizedSponsorId, createdUser._id, session);
    await autoActivateEligibleUplines(placementResult.placement.parentId, session);

    await session.commitTransaction();

    const user = await User.findById(createdUser._id).select('-password').lean();
    return user;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Login: find user by email, verify password, return user without password.
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<Object>} User document (no password)
 */
export async function login(payload) {
  const { email, password } = payload;

  if (!email?.trim() || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').lean();
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  await ensureReferralNumber(user._id);

  return User.findById(user._id).select('-password').lean();
}
