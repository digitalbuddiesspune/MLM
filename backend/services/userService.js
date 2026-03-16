import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { findBinaryPlacement } from './treeService.js';

const SALT_ROUNDS = 10;

/**
 * Registers a new user. If sponsorId is provided, places them in the binary tree under sponsor.
 * If no sponsorId (root user), creates user without placement.
 * @param {{ name: string, email: string, password: string, sponsorId?: string, panNumber?: string, bankAccountNumber?: string, upiId?: string }} payload
 * @returns {Promise<Object>} Created user (password excluded)
 */
export async function register(payload) {
  const { name, email, password, sponsorId, panNumber, bankAccountNumber, upiId } = payload;
  const extra = {};
  if (panNumber != null && String(panNumber).trim()) extra.panNumber = String(panNumber).trim();
  if (bankAccountNumber != null && String(bankAccountNumber).trim()) extra.bankAccountNumber = String(bankAccountNumber).trim();
  if (upiId != null && String(upiId).trim()) extra.upiId = String(upiId).trim();

  const existing = await User.findOne({ email: email?.toLowerCase() }).select('_id').lean();
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const hasSponsor = sponsorId && mongoose.isValidObjectId(sponsorId);

  if (!hasSponsor) {
    const [createdUser] = await User.create([
      {
        name: name?.trim(),
        email: email?.toLowerCase().trim(),
        password: hashedPassword,
        sponsorId: null,
        parentId: null,
        position: null,
        ...extra,
      },
    ]);
    return User.findById(createdUser._id).select('-password').lean();
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { parentId, position } = await findBinaryPlacement(sponsorId, session);

    const [createdUser] = await User.create(
      [
        {
          name: name?.trim(),
          email: email?.toLowerCase().trim(),
          password: hashedPassword,
          sponsorId,
          parentId,
          position,
          ...extra,
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
