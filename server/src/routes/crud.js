import { Router } from 'express';
import { Category, AuctionListing, Testimonial, Faq, SiteSetting } from '../models/index.js';
import { protect, can } from '../middleware/auth.js';
import { AppError, asyncHandler, ok, paginate, pageMeta } from '../utils/helpers.js';

// Generic CRUD: public GET, permissioned writes. `fields` whitelists writable keys.
function crud(Model, { permission, fields, publicFilter = {}, sort = { createdAt: -1 } }) {
  const r = Router();
  const pick = (b) => Object.fromEntries(Object.entries(b).filter(([k]) => fields.includes(k)));
  r.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query, 100);
    const [items, total] = await Promise.all([Model.find(publicFilter).sort(sort).skip(skip).limit(limit).lean(), Model.countDocuments(publicFilter)]);
    ok(res, items, pageMeta(total, page, limit));
  }));
  r.get('/all', protect, can(permission), asyncHandler(async (_req, res) => ok(res, await Model.find().sort(sort).lean())));
  r.post('/', protect, can(permission), asyncHandler(async (req, res) => ok(res, await Model.create(pick(req.body)), {}, 201)));
  r.put('/:id', protect, can(permission), asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new AppError('Not found', 404);
    Object.assign(doc, pick(req.body)); await doc.save(); ok(res, doc);
  }));
  r.delete('/:id', protect, can(permission), asyncHandler(async (req, res) => {
    if (!(await Model.findByIdAndDelete(req.params.id))) throw new AppError('Not found', 404);
    ok(res, null);
  }));
  return r;
}

export const categories = crud(Category, { permission: 'vehicles', fields: ['name', 'description'], sort: { name: 1 } });
export const auctions = crud(AuctionListing, { permission: 'vehicles', publicFilter: { published: true }, fields: ['make', 'model', 'manufacturingYear', 'auctionGrade', 'mileage', 'engineCapacity', 'fuelType', 'transmission', 'auctionHouse', 'auctionDate', 'startingBid', 'currency', 'estimatedLandedCost', 'images', 'availability', 'published'], sort: { auctionDate: 1 } });
export const testimonials = crud(Testimonial, { permission: 'content', publicFilter: { published: true }, fields: ['name', 'location', 'quote', 'rating', 'published'] });
export const faqs = crud(Faq, { permission: 'content', publicFilter: { published: true }, fields: ['question', 'answer', 'order', 'published'], sort: { order: 1 } });

export const settings = Router();
settings.get('/', asyncHandler(async (_req, res) => ok(res, (await SiteSetting.findOne({ key: 'main' }).lean()) || {})));
settings.put('/', protect, can('content'), asyncHandler(async (req, res) => {
  const allowed = ['heroTitle', 'heroSubtitle', 'companyName', 'phone', 'whatsapp', 'email', 'address', 'socialLinks'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  ok(res, await SiteSetting.findOneAndUpdate({ key: 'main' }, data, { new: true, upsert: true, setDefaultsOnInsert: true }));
}));
