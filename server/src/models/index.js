import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { IMPORT_STATUSES } from '../utils/helpers.js';

const { Schema, model } = mongoose;
const ref = (name, extra = {}) => ({ type: Schema.Types.ObjectId, ref: name, ...extra });
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* ---------- User ---------- */
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
  permissions: [{ type: String }], // for staff: vehicles, imports, inquiries, quotations, content, tax
  profileImage: String,
  emailVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  verifyTokenHash: { type: String, select: false },
  resetTokenHash: { type: String, select: false },
  resetExpires: { type: Date, select: false },
}, { timestamps: true });
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = function (plain) { return bcrypt.compare(plain, this.password); };
userSchema.methods.createToken = function (field) {
  const raw = crypto.randomBytes(32).toString('hex');
  this[field] = crypto.createHash('sha256').update(raw).digest('hex');
  return raw;
};
userSchema.set('toJSON', { transform: (_d, r) => { delete r.password; delete r.verifyTokenHash; delete r.resetTokenHash; delete r.resetExpires; return r; } });
export const User = model('User', userSchema);

/* ---------- Category ---------- */
const categorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true },
  description: String,
}, { timestamps: true });
categorySchema.pre('validate', function (next) { if (this.name && !this.slug) this.slug = slugify(this.name); next(); });
export const Category = model('Category', categorySchema);

/* ---------- Vehicle ---------- */
const vehicleSchema = new Schema({
  // identification
  make: { type: String, required: true, trim: true, index: true },
  model: { type: String, required: true, trim: true, index: true },
  variant: String,
  manufacturingYear: { type: Number, required: true, min: 1980, max: new Date().getFullYear() + 1, index: true },
  registrationYear: Number,
  registrationMonth: { type: Number, min: 1, max: 12 },
  vehicleCategory: { type: String, index: true }, // category slug
  bodyType: String,
  countryOfOrigin: String,
  importStatus: { type: String, enum: ['local', 'imported', 'import-available'], default: 'local', index: true },
  registrationNumber: String,
  VIN: { type: String, select: false },
  chassisNumber: { type: String, select: false },
  engineNumber: { type: String, select: false },
  // specs
  engineCapacity: Number, engineType: String,
  fuelType: { type: String, enum: ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'], index: true },
  transmission: { type: String, enum: ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'], index: true },
  drivetrain: String, horsepower: Number, torque: Number,
  mileage: { type: Number, min: 0, index: true },
  fuelEconomy: String, seatingCapacity: Number, numberOfDoors: Number,
  exteriorColor: String, interiorColor: String,
  dimensions: { length: Number, width: Number, height: Number, wheelbase: Number },
  // features
  safetyFeatures: [String], comfortFeatures: [String], technologyFeatures: [String],
  exteriorFeatures: [String], interiorFeatures: [String],
  // condition
  condition: { type: String, enum: ['New', 'Used', 'Reconditioned'], default: 'Used', index: true },
  accidentHistory: String, serviceHistory: String, previousOwners: Number, inspectionStatus: String,
  warranty: String,
  // pricing
  purchasePrice: { type: Number, select: false },
  sellingPrice: { type: Number, min: 0, index: true },
  currency: { type: String, default: 'LKR' },
  estimatedImportCost: Number, depositAmount: Number,
  // listing
  title: { type: String, required: true },
  description: String,
  slug: { type: String, unique: true, index: true },
  images: [{ url: String, publicId: String }],
  featured: { type: Boolean, default: false, index: true },
  availabilityStatus: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available', index: true },
  listingStatus: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  // import info
  auctionHouse: String, auctionGrade: String, auctionDate: Date, auctionPrice: Number,
  CIFValue: Number, shippingCost: Number, estimatedTaxes: Number, estimatedLandedCost: Number,
  createdBy: ref('User'), updatedBy: ref('User'),
}, { timestamps: true });
vehicleSchema.index({ title: 'text', make: 'text', model: 'text', variant: 'text' });
vehicleSchema.pre('validate', function (next) {
  if (!this.title) this.title = [this.make, this.model, this.variant, this.manufacturingYear].filter(Boolean).join(' ');
  if (!this.slug) this.slug = `${slugify(`${this.make} ${this.model} ${this.manufacturingYear}`)}-${crypto.randomBytes(2).toString('hex')}`;
  next();
});
export const Vehicle = model('Vehicle', vehicleSchema);

/* ---------- Auction listings (admin-managed; swap for a real API later) ---------- */
const auctionSchema = new Schema({
  make: { type: String, required: true }, model: { type: String, required: true },
  manufacturingYear: Number, auctionGrade: String, mileage: Number, engineCapacity: Number,
  fuelType: String, transmission: String, auctionHouse: String, auctionDate: Date,
  startingBid: Number, currency: { type: String, default: 'JPY' }, estimatedLandedCost: Number,
  images: [{ url: String, publicId: String }],
  availability: { type: String, enum: ['open', 'closed', 'sold'], default: 'open' },
  published: { type: Boolean, default: true },
}, { timestamps: true });
export const AuctionListing = model('AuctionListing', auctionSchema);

/* ---------- Inquiry ---------- */
const inquirySchema = new Schema({
  customer: ref('User'),
  name: String, email: String, phone: String, // for guests
  vehicle: ref('Vehicle'),
  inquiryType: { type: String, enum: ['general', 'quotation', 'details', 'test-drive'], default: 'general' },
  message: { type: String, required: true, maxlength: 3000 },
  status: { type: String, enum: ['new', 'in-progress', 'resolved', 'closed'], default: 'new', index: true },
  assignedStaff: ref('User'),
  notes: [{ text: String, by: ref('User'), at: { type: Date, default: Date.now } }],
}, { timestamps: true });
export const Inquiry = model('Inquiry', inquirySchema);

/* ---------- Import request ---------- */
const importSchema = new Schema({
  requestNo: { type: String, unique: true },
  customer: ref('User', { required: true, index: true }),
  preferredVehicle: {
    make: String, model: String, manufacturingYear: Number, grade: String,
    fuelType: String, transmission: String,
  },
  auctionListing: ref('AuctionListing'),
  budget: Number,
  timeframe: String,
  requirements: String,
  status: { type: String, enum: IMPORT_STATUSES, default: 'Submitted', index: true },
  assignedStaff: ref('User'),
  progressHistory: [{ status: String, note: String, changedBy: ref('User'), at: { type: Date, default: Date.now } }],
  documents: [{ name: String, type: String, publicId: String, uploadedBy: ref('User'), at: { type: Date, default: Date.now } }], // private
}, { timestamps: true });
importSchema.pre('validate', function (next) {
  if (!this.requestNo) this.requestNo = `IMP-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(1).toString('hex').toUpperCase()}`;
  next();
});
export const ImportRequest =
  mongoose.models.ImportRequest || model('ImportRequest', importSchema);

/* ---------- Quotation ---------- */
const quotationSchema = new Schema({
  quoteNo: { type: String, unique: true },
  customer: ref('User', { required: true, index: true }),
  vehicle: ref('Vehicle'),
  importRequest: ref('ImportRequest'),
  vehiclePrice: { type: Number, required: true, min: 0 },
  shippingCost: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  totalPrice: Number,
  validityPeriod: { type: Number, default: 7 }, // days
  notes: String,
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft', index: true },
  createdBy: ref('User'),
}, { timestamps: true });
quotationSchema.pre('validate', function (next) {
  this.totalPrice = (this.vehiclePrice || 0) + (this.shippingCost || 0) + (this.taxes || 0) + (this.otherCharges || 0);
  if (!this.quoteNo) this.quoteNo = `QT-${Date.now().toString(36).toUpperCase()}`;
  next();
});
export const Quotation = model('Quotation', quotationSchema);

/* ---------- Favorite ---------- */
const favoriteSchema = new Schema({ customer: ref('User', { required: true }), vehicle: ref('Vehicle', { required: true }) }, { timestamps: true });
favoriteSchema.index({ customer: 1, vehicle: 1 }, { unique: true });
export const Favorite = model('Favorite', favoriteSchema);

/* ---------- Notification ---------- */
const notificationSchema = new Schema({
  recipient: ref('User', { required: true, index: true }),
  title: String, message: String, type: { type: String, default: 'info' },
  read: { type: Boolean, default: false },
  relatedEntity: { kind: String, id: Schema.Types.ObjectId },
}, { timestamps: true });
export const Notification = model('Notification', notificationSchema);

/* ---------- Tax configuration (admin-managed; no rates are hardcoded) ---------- */
const taxRuleSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['percent', 'fixed', 'per_cc'], required: true },
  base: { type: String, enum: ['cif', 'running'], default: 'cif' }, // 'running' = CIF + all earlier rules
  value: { type: Number, required: true },
  min: Number,
}, { _id: false });
const taxConfigSchema = new Schema({
  name: { type: String, required: true },
  vehicleCategory: { type: String, default: 'any' },
  fuelType: { type: String, default: 'any' },
  engineCapacityRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 100000 } },
  taxRules: { type: [taxRuleSchema], validate: (v) => v.length > 0 },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: Date,
  isActive: { type: Boolean, default: true },
  notes: String,
  history: [{ at: { type: Date, default: Date.now }, by: ref('User'), action: String, snapshot: Schema.Types.Mixed }],
}, { timestamps: true });
export const TaxConfiguration = model('TaxConfiguration', taxConfigSchema);

/* ---------- Vehicle document ---------- */
export const VehicleDocument = model('VehicleDocument', new Schema({
  vehicle: ref('Vehicle', { required: true, index: true }),
  documentType: { type: String, enum: ['auction-sheet', 'inspection-report', 'registration', 'other'], default: 'other' },
  fileUrl: String, publicId: String, isPublic: { type: Boolean, default: false },
  uploadedBy: ref('User'),
}, { timestamps: true }));

/* ---------- Content ---------- */
export const Testimonial = model('Testimonial', new Schema({
  name: { type: String, required: true }, location: String, quote: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 }, published: { type: Boolean, default: true },
}, { timestamps: true }));
export const Faq = model('Faq', new Schema({
  question: { type: String, required: true }, answer: { type: String, required: true },
  order: { type: Number, default: 0 }, published: { type: Boolean, default: true },
}, { timestamps: true }));
export const SiteSetting = model('SiteSetting', new Schema({
  key: { type: String, default: 'main', unique: true },
  heroTitle: String, heroSubtitle: String,
  companyName: { type: String, default: 'Cars@855' },
  phone: String, whatsapp: String, email: String, address: String, // admin-managed, never invented
  socialLinks: { facebook: String, instagram: String, tiktok: String },
}, { timestamps: true }));
