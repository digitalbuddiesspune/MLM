/**
 * Promote an existing user to admin by email.
 * Run: node scripts/promote-user.js <email> admin
 * Example: node scripts/promote-user.js user@example.com admin
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const [email, role] = process.argv.slice(2);

if (!email || !role) {
  console.log('Usage: node scripts/promote-user.js <email> admin');
  console.log('Example: node scripts/promote-user.js user@example.com admin');
  process.exit(1);
}

if (role !== 'admin') {
  console.error('Role must be "admin"');
  process.exit(1);
}

async function promote() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }
    user.role = role;
    await user.save();
    console.log(`Promoted ${email} to admin. They can now access /admin/dashboard`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

promote();
