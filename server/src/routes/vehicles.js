import { Router } from 'express';
import mongoose from 'mongoose';
import { Vehicle, Favorite, User } from '../models/index.js';
import { protect, optionalAuth, can, isStaff } from '../middleware/auth.js';
import { AppError, asyncHandler, ok, paginate, pageMeta, escapeRegex } from '../utils/helpers.js';
import { notify } from '../services/notify.js';
import { templates } from '../services/email.js';
import { destroy } from '../services/upload.js';
import { env } from '../config/env.js';

const r = Router();
const SORTS = { newest: { createdAt: -1 }, 'price-asc': { sellingPrice: 1 }, 'price-desc': { sellingPrice: -1 }, 'mileage-asc': { mileage: 1 }, 'year-desc': { manufacturingYear: -1 } };
const WRITABLE = ['make', 'model', 'variant', 'manufacturingYear', 'registrationYear', 'registrationMonth', 'vehicleCategory', 'bodyType', 'countryOfOrigin', 'importStatus', 'registrationNumber', 'VIN', 'chassisNumber', 'engineNumber', 'engineCapacity', 'engineType', 'fuelType', 'transmission', 'drivetrain', 'horsepower', 'torque', 'mileage', 'fuelEconomy', 'seatingCapacity', 'numberOfDoors', 'exteriorColor', 'interiorColor', 'dimensions', 'safetyFeatures', 'comfortFeatures', 'technologyFeatures', 'exteriorFeatures', 'interiorFeatures', 'condition', 'accidentHistory', 'serviceHistory', 'previousOwners', 'inspectionStatus', 'warranty', 'purchasePrice', 'sellingPrice', 'currency', 'estimatedImportCost', 'depositAmount', 'title', 'description', 'images', 'featured', 'availabilityStatus', 'listingStatus', 'auctionHouse', 'auctionGrade', 'auctionDate', 'auctionPrice', 'CIFValue', 'shippingCost', 'estimatedTaxes', 'estimatedLandedCost'];
const pick = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => WRITABLE.includes(k)));

r.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const q = req.query, f = {};
  if (!isStaff(req.user)) f.listingStatus = 'published'; else if (q.listingStatus) f.listingStatus = q.listingStatus;
  for (const k of ['make', 'model', 'vehicleCategory', 'fuelType', 'transmission', 'condition', 'importStatus', 'availabilityStatus']) if (q[k]) f[k] = String(q[k]);
  if (q.featured === 'true') f.featured = true;
  const range = (field, min, max) => { if (min || max) f[field] = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) }; };
  range('manufacturingYear', q.yearMin, q.yearMax); range('sellingPrice', q.priceMin, q.priceMax);
  range('engineCapacity', q.ccMin, q.ccMax); range('mileage', null, q.mileageMax);
  if (q.q) { const rx = new RegExp(escapeRegex(q.q), 'i'); f.$or = [{ title: rx }, { make: rx }, { model: rx }, { variant: rx }]; }
  const { page, limit, skip } = paginate(q);
  const [items, total] = await Promise.all([
    Vehicle.find(f).sort(SORTS[q.sort] || SORTS.newest).skip(skip).limit(limit).lean(),
    Vehicle.countDocuments(f),
  ]);
  ok(res, items, pageMeta(total, page, limit));
}));

r.get('/facets', asyncHandler(async (_req, res) => {
  const base = { listingStatus: 'published' };
  const [makes, models, years] = await Promise.all([Vehicle.distinct('make', base), Vehicle.distinct('model', base), Vehicle.distinct('manufacturingYear', base)]);
  ok(res, { makes: makes.sort(), models: models.sort(), years: years.sort((a, b) => b - a) });
}));

r.get('/:idOrSlug', optionalAuth, asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const filter = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  if (!isStaff(req.user)) filter.listingStatus = 'published';
  const v = await Vehicle.findOne(filter).lean();
  if (!v) throw new AppError('Vehicle not found', 404);
  const related = await Vehicle.find({ _id: { $ne: v._id }, listingStatus: 'published', $or: [{ make: v.make }, { vehicleCategory: v.vehicleCategory }] }).limit(4).lean();
  ok(res, v, { related });
}));

r.post('/', protect, can('vehicles'), asyncHandler(async (req, res) => {
  const v = await Vehicle.create({ ...pick(req.body), createdBy: req.user._id, updatedBy: req.user._id });
  ok(res, v, {}, 201);
}));

r.put('/:id', protect, can('vehicles'), asyncHandler(async (req, res) => {
  const v = await Vehicle.findById(req.params.id);
  if (!v) throw new AppError('Vehicle not found', 404);
  const prevStatus = v.availabilityStatus;
  Object.assign(v, pick(req.body)); v.updatedBy = req.user._id;
  await v.save();
  if (prevStatus !== v.availabilityStatus) {
    const favs = await Favorite.find({ vehicle: v._id }).populate('customer');
    await Promise.all(favs.filter((f) => f.customer).map((f) => notify(f.customer, {
      title: 'Vehicle availability changed', message: `${v.title} is now ${v.availabilityStatus}.`, type: 'vehicle',
      entity: { kind: 'Vehicle', id: v._id }, email: templates.vehicleStatus(f.customer.name, v.title, v.availabilityStatus, `${env.clientUrl}/vehicles/${v.slug}`),
    })));
  }
  ok(res, v);
}));

r.delete('/:id', protect, can('vehicles'), asyncHandler(async (req, res) => {
  const v = await Vehicle.findByIdAndDelete(req.params.id);
  if (!v) throw new AppError('Vehicle not found', 404);
  await Promise.all([Favorite.deleteMany({ vehicle: v._id }), ...v.images.map((i) => i.publicId && destroy(i.publicId))]);
  ok(res, null);
}));
export default r;
