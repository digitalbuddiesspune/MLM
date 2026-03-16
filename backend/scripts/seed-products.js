/**
 * Seed script for MLM products.
 * Run: node scripts/seed-products.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const SEED_PRODUCTS = [
  {
    name: 'Ortho Care',
    slug: 'ortho-care',
    description: 'Joint and bone health support.',
    price: 0,
    businessVolume: 0,
    isActive: true,
  },
  {
    name: 'Sugar Tee',
    slug: 'sugar-tee',
    description: 'Blood sugar balance support.',
    price: 0,
    businessVolume: 0,
    isActive: true,
  },
  {
    name: 'A Stone for Kidneys',
    slug: 'a-stone-for-kidneys',
    description: 'Kidney and urinary wellness support.',
    price: 0,
    businessVolume: 0,
    isActive: true,
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    for (const p of SEED_PRODUCTS) {
      const existing = await Product.findOne({ slug: p.slug });
      if (existing) {
        existing.name = p.name;
        existing.description = p.description;
        existing.price = p.price;
        existing.businessVolume = p.businessVolume;
        existing.isActive = p.isActive;
        await existing.save();
        console.log(`Updated product: ${p.name}`);
      } else {
        await Product.create(p);
        console.log(`Created product: ${p.name}`);
      }
    }

    console.log('\nProducts seeded. Update price and businessVolume in DB or via admin as needed.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedProducts();
