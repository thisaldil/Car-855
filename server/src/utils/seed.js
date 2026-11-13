import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Category, SiteSetting, Faq } from '../models/index.js';
import { assertEnv, env } from '../config/env.js';
import { connectDB } from '../config/db.js';

assertEnv();
await connectDB();
const { ADMIN_NAME = 'Site Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding');
if (!(await User.exists({ email: ADMIN_EMAIL.toLowerCase() }))) {
  await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin', emailVerified: true });
  console.log('Admin created:', ADMIN_EMAIL);
} else console.log('Admin already exists');
for (const name of ['Hatchback', 'Sedan', 'SUV', 'Van', 'Pickup', 'Coupe']) await Category.updateOne({ name }, { $setOnInsert: { name, slug: name.toLowerCase() } }, { upsert: true });
await SiteSetting.updateOne({ key: 'main' }, { $setOnInsert: { key: 'main', heroTitle: 'Your Dream Car, Imported with Confidence', heroSubtitle: 'Discover quality vehicles from Japan and Sri Lanka. Get transparent pricing, trusted import support, and a smooth vehicle purchasing experience.' } }, { upsert: true });
if (!(await Faq.countDocuments())) await Faq.insertMany([
  { question: 'How does importing a vehicle from Japan work?', answer: 'You submit an import request, we search auctions and suppliers, send a quotation, and handle purchase, shipping and clearance once you approve.', order: 1 },
  { question: 'Is the calculator result final?', answer: 'No. It is an estimate. Final charges depend on official customs assessments.', order: 2 },
]);
console.log('Seed complete. Remember to add a Tax Configuration in the admin dashboard before using the calculator.');
await mongoose.disconnect();
