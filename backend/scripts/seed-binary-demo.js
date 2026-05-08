/**
 * Creates a small binary team under the first admin for UI demos.
 * Run: npm run seed:binary-demo
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { register } from '../services/userService.js';

const DEMO_PASSWORD = 'Demo@1234';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).select('referralNumber email').lean();
  if (!admin?.referralNumber) {
    console.error('No admin with referralNumber. Run npm run seed first.');
    process.exit(1);
  }

  const sponsorCode = String(admin.referralNumber);
  const stamp = Date.now().toString(36);

  const seeds = [
    { name: 'Binary Demo Alpha', mobile: `91${String(stamp).slice(-8)}01`, email: `bin-alpha-${stamp}@demo.local` },
    { name: 'Binary Demo Beta', mobile: `91${String(stamp).slice(-8)}02`, email: `bin-beta-${stamp}@demo.local` },
    { name: 'Binary Demo Gamma', mobile: `91${String(stamp).slice(-8)}03`, email: `bin-gamma-${stamp}@demo.local` },
    { name: 'Binary Demo Delta', mobile: `91${String(stamp).slice(-8)}04`, email: `bin-delta-${stamp}@demo.local` },
    { name: 'Binary Demo Epsilon', mobile: `91${String(stamp).slice(-8)}05`, email: `bin-epsilon-${stamp}@demo.local` },
    { name: 'Binary Demo Zeta', mobile: `91${String(stamp).slice(-8)}06`, email: `bin-zeta-${stamp}@demo.local` },
    { name: 'Binary Demo Eta', mobile: `91${String(stamp).slice(-8)}07`, email: `bin-eta-${stamp}@demo.local` },
  ];

  let created = 0;
  for (const row of seeds) {
    const exists = await User.exists({ email: row.email });
    if (exists) {
      console.log('Skip (exists):', row.email);
      continue;
    }
    await register({
      name: row.name,
      mobile: row.mobile,
      email: row.email,
      password: DEMO_PASSWORD,
      sponsorId: sponsorCode,
    });
    created += 1;
    console.log('Registered:', row.email, 'under sponsor', sponsorCode);
  }

  console.log(`\nDone. Created ${created} demo member(s). Password: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
