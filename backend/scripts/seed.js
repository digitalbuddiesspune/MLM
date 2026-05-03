/**
 * Seed script: creates a single admin user.
 * Run: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Counter from '../models/Counter.js';
import { ensureReferralNumber } from '../services/referralNumberService.js';

const SALT_ROUNDS = 10;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    await Counter.findOneAndUpdate(
      { _id: 'userReferral' },
      { $setOnInsert: { seq: 100_000 } },
      { upsert: true }
    );

    const admin = {
      name: 'Balwant More',
      email: 'admin@gmail.com',
      password: 'admin@123',
      mobile: '9922335831',
      role: 'admin',
    };

    const existing = await User.findOne({ email: admin.email });
    const hashedPassword = await bcrypt.hash(admin.password, SALT_ROUNDS);

    if (existing) {
      existing.name = admin.name;
      existing.mobile = admin.mobile;
      existing.password = hashedPassword;
      existing.role = admin.role;
      await existing.save();
      console.log(`Updated admin: ${admin.email}`);
    } else {
      await User.create({
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        password: hashedPassword,
        role: admin.role,
        sponsorId: null,
        parentId: null,
      });
      console.log(`Created admin: ${admin.email}`);
    }

    const missingRef = await User.find({ referralNumber: { $exists: false } })
      .sort({ createdAt: 1 })
      .select('_id')
      .lean();

    let assigned = 0;
    for (const row of missingRef) {
      await ensureReferralNumber(row._id);
      assigned += 1;
    }
    if (assigned > 0) {
      console.log(`Assigned numeric referral codes to ${assigned} user(s).`);
    }

    console.log('\nDone!');
    console.log('  Admin: admin@gmail.com / admin@123');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
