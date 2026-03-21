import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { findBinaryPlacement } from './treeService.js';
import { applySponsorJoinEffects, autoActivateEligibleUplines } from './levelService.js';

const SALT_ROUNDS = 10;

/**
 * Registers a new user with minimal fields.
 * If sponsorId is provided, places them in the binary tree under sponsor.
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
  const normalizedSponsorId = String(sponsorId ?? '').trim();
  if (!normalizedSponsorId) {
    const err = new Error('Sponsor ID is required');
    err.statusCode = 400;
    throw err;
  }
  if (!mongoose.isValidObjectId(normalizedSponsorId)) {
    const err = new Error('Sponsor ID must be a valid MongoDB ObjectId');
    err.statusCode = 400;
    throw err;
  }

  const sponsor = await User.findById(normalizedSponsorId).select('_id').lean();
  if (!sponsor) {
    const err = new Error('Sponsor not found');
    err.statusCode = 404;
    throw err;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { parentId, position } = await findBinaryPlacement(normalizedSponsorId, session);

    const [createdUser] = await User.create(
      [
        {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email?.toLowerCase().trim(),
          password: hashedPassword,
          sponsorId: normalizedSponsorId,
          parentId,
          position,
        },
      ],
      { session }
    );

    const updateField = position === 'left' ? 'leftChildId' : 'rightChildId';
    await User.findByIdAndUpdate(
      parentId,
      { $set: { [updateField]: createdUser._id } },
      { session }
    );

    await applySponsorJoinEffects(normalizedSponsorId, createdUser._id, session);
    await autoActivateEligibleUplines(parentId, session);

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

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
