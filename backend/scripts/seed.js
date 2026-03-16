/**
 * Seed script: admin + 4 users.
 * - sponsorId: for commission (User 1,2 under Admin; User 3,4 under User 1).
 * - Binary placement: all 4 placed under Admin in BFS order so the tree is:
 *     Admin
 *    /     \
 * User1   User2
 *  / \
 * U3  U4
 * So User 1 sees themselves as parent with User 3 & 4; Admin sees full tree. Commission is by sponsorId (level-wise).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { insertUserInBinaryTree } from '../services/treeService.js';

const SALT_ROUNDS = 10;

async function createOrUpdateUser(u, sponsorId) {
  const existing = await User.findOne({ email: u.email });
  const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);

  if (existing) {
    existing.role = u.role;
    existing.password = hashedPassword;
    existing.name = u.name;
    existing.panNumber = u.panNumber ?? '';
    existing.bankAccountNumber = u.bankAccountNumber ?? '';
    existing.upiId = u.upiId ?? '';
    if (sponsorId != null) existing.sponsorId = sponsorId;
    await existing.save();
    console.log(`Updated ${u.role}: ${u.email}`);
    return existing._id;
  }

  const doc = await User.create({
    email: u.email,
    name: u.name,
    password: hashedPassword,
    role: u.role,
    sponsorId: sponsorId ?? null,
    parentId: null,
    panNumber: u.panNumber ?? '',
    bankAccountNumber: u.bankAccountNumber ?? '',
    upiId: u.upiId ?? '',
  });
  console.log(`Created ${u.role}: ${u.email}`);
  return doc._id;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    const admin = {
      name: 'admin',
      email: 'admin@gmail.com',
      password: 'admin@123',
      role: 'admin',
      panNumber: 'DUMMYPAN123',
      bankAccountNumber: '1234567890123456',
      upiId: 'admin@dummyupi',
    };
    const adminId = await createOrUpdateUser(admin, null);

    const userOne = {
      name: 'User One',
      email: 'user1@example.com',
      password: 'user@123',
      role: 'user',
      panNumber: 'DUMMYPAN001',
      bankAccountNumber: '1111222233334444',
      upiId: 'user1@dummyupi',
    };
    const userOneId = await createOrUpdateUser(userOne, adminId);

    const userTwo = {
      name: 'User Two',
      email: 'user2@example.com',
      password: 'user@123',
      role: 'user',
      panNumber: 'DUMMYPAN002',
      bankAccountNumber: '2222333344445555',
      upiId: 'user2@dummyupi',
    };
    const userTwoId = await createOrUpdateUser(userTwo, adminId);

    const userThree = {
      name: 'User Three',
      email: 'user3@example.com',
      password: 'user@123',
      role: 'user',
      panNumber: 'DUMMYPAN003',
      bankAccountNumber: '3333444455556666',
      upiId: 'user3@dummyupi',
    };
    const userThreeId = await createOrUpdateUser(userThree, userOneId);

    const userFour = {
      name: 'User Four',
      email: 'user4@example.com',
      password: 'user@123',
      role: 'user',
      panNumber: 'DUMMYPAN004',
      bankAccountNumber: '4444555566667777',
      upiId: 'user4@dummyupi',
    };
    const userFourId = await createOrUpdateUser(userFour, userOneId);

    // Place users in binary tree under admin (BFS order): User1, User2, User3, User4
    const order = [userOneId, userTwoId, userThreeId, userFourId];
    for (const uid of order) {
      try {
        await insertUserInBinaryTree(adminId, uid);
        console.log('  Placed in binary tree:', uid.toString().slice(0, 8) + '…');
      } catch (e) {
        if (e.message && e.message.includes('already placed')) {
          console.log('  Already placed, skip:', uid.toString().slice(0, 8) + '…');
        } else throw e;
      }
    }

    console.log('\nDone! Binary tree: Admin → User1, User2; User1 → User3, User4. Commission by sponsorId.');
    console.log('  Admin: admin@gmail.com / admin@123');
    console.log('  User One: user1@example.com / user@123  (sees User 3 & 4 in tree)');
    console.log('  User Two: user2@example.com / user@123');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
