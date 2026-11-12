import { Router } from 'express';
import { z } from 'zod';
import { Favorite, Vehicle, TaxConfiguration, Notification, User, Inquiry, ImportRequest, Quotation, VehicleDocument } from '../models/index.js';
import { protect, can, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, ok, paginate, pageMeta } from '../utils/helpers.js';
import { estimate } from '../services/calculator.js';
import {
  imageUpload,
  docUpload,
  uploadBuffer,
  signedUrl,
  destroy
} from '../services/upload.js';
const oid = z.string().regex(/^[a-f\d]{24}$/i);

/* Favorites */
export const favorites = Router();
favorites.use(protect);
favorites.get('/', asyncHandler(async (req, res) => ok(res, (await Favorite.find({ customer: req.user._id }).populate('vehicle').sort({ createdAt: -1 }).lean()).filter((f) => f.vehicle))));
favorites.post('/', validate(z.object({ vehicle: oid })), asyncHandler(async (req, res) => {
  if (!(await Vehicle.exists({ _id: req.body.vehicle, listingStatus: 'published' }))) throw new AppError('Vehicle not found', 404);
  await Favorite.updateOne({ customer: req.user._id, vehicle: req.body.vehicle }, {}, { upsert: true });
  ok(res, { saved: true }, {}, 201);
}));
favorites.delete('/:vehicleId', asyncHandler(async (req, res) => { await Favorite.deleteOne({ customer: req.user._id, vehicle: req.params.vehicleId }); ok(res, null); }));

/* Tax configuration (admin-managed, with history) */
export const tax = Router();
const ruleSchema = z.object({ name: z.string().min(1), type: z.enum(['percent', 'fixed', 'per_cc']), base: z.enum(['cif', 'running']).default('cif'), value: z.coerce.number(), min: z.coerce.number().optional() });
const taxSchema = z.object({
  name: z.string().min(2), vehicleCategory: z.string().default('any'), fuelType: z.string().default('any'),
  engineCapacityRange: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }).default({ min: 0, max: 100000 }),
  taxRules: z.array(ruleSchema).min(1), effectiveFrom: z.coerce.date(), effectiveTo: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true), notes: z.string().max(1000).optional(),
});
tax.use(protect, can('tax'));
tax.get('/', asyncHandler(async (_req, res) => ok(res, await TaxConfiguration.find().sort({ effectiveFrom: -1 }).lean())));
tax.post('/', validate(taxSchema), asyncHandler(async (req, res) => {
  const c = await TaxConfiguration.create({ ...req.body, history: [{ by: req.user._id, action: 'created', snapshot: req.body }] });
  ok(res, c, {}, 201);
}));
tax.put('/:id', validate(taxSchema.partial()), asyncHandler(async (req, res) => {
  const c = await TaxConfiguration.findById(req.params.id);
  if (!c) throw new AppError('Configuration not found', 404);
  const before = c.toObject(); delete before.history;
  c.history.push({ by: req.user._id, action: 'updated', snapshot: before }); // keep the previous version
  Object.assign(c, req.body); await c.save(); ok(res, c);
}));
tax.delete('/:id', asyncHandler(async (req, res) => {
  const c = await TaxConfiguration.findById(req.params.id);
  if (!c) throw new AppError('Configuration not found', 404);
  c.isActive = false; c.history.push({ by: req.user._id, action: 'deactivated' }); await c.save(); // soft delete preserves history
  ok(res, c);
}));

/* Calculator */
export const calculator = Router();
calculator.post('/estimate', validate(z.object({
  vehicleCategory: z.string().default('any'), fuelType: z.string().default('any'), engineCapacity: z.coerce.number().min(0).default(0),
  cifValue: z.coerce.number().positive(), exchangeRate: z.coerce.number().positive().default(1),
  shippingCost: z.coerce.number().min(0).default(0), otherCharges: z.coerce.number().min(0).default(0),
  make: z.string().optional(), model: z.string().optional(), manufacturingYear: z.coerce.number().optional(),
})), asyncHandler(async (req, res) => ok(res, await estimate(req.body))));

/* Notifications */
export const notifications = Router();
notifications.use(protect);
notifications.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 50);
  const f = { recipient: req.user._id };
  const [items, total, unread] = await Promise.all([Notification.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Notification.countDocuments(f), Notification.countDocuments({ ...f, read: false })]);
  ok(res, items, { ...pageMeta(total, page, limit), unread });
}));
notifications.patch('/read-all', asyncHandler(async (req, res) => { await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true }); ok(res, null); }));
notifications.patch('/:id/read', asyncHandler(async (req, res) => { await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { read: true }); ok(res, null); }));

/* Uploads */
export const uploads = Router();
uploads.use(protect);
uploads.post('/vehicle-images', can('vehicles'), imageUpload.array('images', 10), asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new AppError('No files uploaded', 422);
  const out = await Promise.all(req.files.map((f) => uploadBuffer(f, { folder: 'vehicles' })));
  ok(res, out.map((o) => ({ url: o.url, publicId: o.publicId })), {}, 201);
}));
uploads.post('/vehicle-documents/:vehicleId', can('vehicles'), docUpload.single('file'), asyncHandler(async (req, res) => {
  console.log('BODY:', req.body);
  console.log('FILE:', req.file && { name: req.file.originalname, mime: req.file.mimetype });
  if (!req.file) throw new AppError('No file uploaded', 422);
  const o = await uploadBuffer(req.file, { folder: 'vehicle-docs', privateFile: true });
  ok(res, await VehicleDocument.create({ vehicle: req.params.vehicleId, documentType: req.body.documentType || 'other', publicId: o.publicId, uploadedBy: req.user._id }), {}, 201);
}));
uploads.post('/import-documents/:id', docUpload.single('file'), asyncHandler(async (req, res) => {
  const d = await ImportRequest.findById(req.params.id);

  const staff = ['admin', 'staff'].includes(req.user.role);

  if (!d || (!staff && String(d.customer) !== String(req.user._id))) {
    throw new AppError('Import request not found', 404);
  }

  if (!req.file) {
    throw new AppError('No file uploaded', 422);
  }

  const o = await uploadBuffer(req.file, {
    folder: 'import-docs',
    privateFile: true,
  });

  try {
    d.documents.push({
      name: req.file.originalname.slice(0, 120),
      type: req.body.type || 'other',
      publicId: o.publicId,
      uploadedBy: req.user._id,
    });

    await d.save();
  } catch (e) {
    console.error('DOCUMENT SAVE ERROR:', e);

    try {
      await destroy(o.publicId, {
        type: 'private',
        resourceType: o.resourceType,
      });
    } catch (cleanupError) {
      console.error('CLOUDINARY CLEANUP ERROR:', cleanupError);
    }

    throw e;
  }

  ok(res, { name: req.file.originalname }, {}, 201);
}));
// Short-lived signed link; only the owning customer or staff
uploads.get('/import-documents/:id/:docId', asyncHandler(async (req, res) => {
  const d = await ImportRequest.findById(req.params.id);
  const staff = ['admin', 'staff'].includes(req.user.role);
  if (!d || (!staff && String(d.customer) !== String(req.user._id))) throw new AppError('Not found', 404);
  const doc = d.documents.id(req.params.docId);
  if (!doc) throw new AppError('Document not found', 404);
  ok(res, { url: signedUrl(doc.publicId, req.query.format || 'pdf'), expiresInSeconds: 300 });
}));

/* Admin */
export const admin = Router();
admin.use(protect, restrictTo('admin', 'staff'));
admin.get('/dashboard', asyncHandler(async (_req, res) => {
  const active = { status: { $nin: ['Delivered', 'Cancelled'] } };
  const [total, available, reserved, sold, customers, pendingInquiries, activeImports, completedImports, quotations, byStatus] = await Promise.all([
    Vehicle.countDocuments(), Vehicle.countDocuments({ availabilityStatus: 'available' }), Vehicle.countDocuments({ availabilityStatus: 'reserved' }), Vehicle.countDocuments({ availabilityStatus: 'sold' }),
    User.countDocuments({ role: 'customer' }), Inquiry.countDocuments({ status: 'new' }), ImportRequest.countDocuments(active), ImportRequest.countDocuments({ status: 'Delivered' }), Quotation.countDocuments(),
    ImportRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  ok(res, { totalVehicles: total, availableVehicles: available, reservedVehicles: reserved, soldVehicles: sold, totalCustomers: customers, pendingInquiries, activeImports, completedImports, totalQuotations: quotations, importsByStatus: byStatus.map((s) => ({ status: s._id, count: s.count })) });
}));
admin.get('/customers', can('customers'), asyncHandler(async (req, res) => {
  const f = { role: 'customer' };
  if (req.query.q) { const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); f.$or = [{ name: rx }, { email: rx }, { phone: rx }]; }
  const { page, limit, skip } = paginate(req.query, 100);
  const [items, total] = await Promise.all([User.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(f)]);
  ok(res, items.map(({ password, ...u }) => u), pageMeta(total, page, limit));
}));
admin.get('/staff', restrictTo('admin'), asyncHandler(async (_req, res) => ok(res, await User.find({ role: { $in: ['staff', 'admin'] } }).lean())));
admin.post('/staff', restrictTo('admin'), validate(z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(['staff', 'admin']).default('staff'), permissions: z.array(z.enum(['vehicles', 'imports', 'inquiries', 'quotations', 'content', 'tax', 'customers', 'reports'])).default([]) })), asyncHandler(async (req, res) => ok(res, await User.create({ ...req.body, emailVerified: true }), {}, 201)));
admin.patch('/users/:id', restrictTo('admin'), validate(z.object({ status: z.enum(['active', 'suspended']).optional(), permissions: z.array(z.string()).optional() })), asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new AppError('You cannot modify your own account here', 409);
  ok(res, await User.findByIdAndUpdate(req.params.id, req.body, { new: true }));
}));
admin.get('/reports', can('reports'), asyncHandler(async (req, res) => {
  const type = req.query.type || 'imports';
  const sources = { imports: [ImportRequest, ['requestNo', 'status', 'budget', 'createdAt'], 'customer'], inquiries: [Inquiry, ['name', 'email', 'inquiryType', 'status', 'createdAt']], quotations: [Quotation, ['quoteNo', 'totalPrice', 'status', 'createdAt']] };
  const src = sources[type]; if (!src) throw new AppError('Unknown report type', 400);
  const rows = await src[0].find().sort({ createdAt: -1 }).limit(5000).lean();
  if (req.query.format !== 'csv') return ok(res, rows);
  const cell = (v) => { let s = v instanceof Date ? v.toISOString() : String(v ?? ''); if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; }; // CSV injection guard
  res.type('text/csv').attachment(`${type}-report.csv`).send([src[1].join(','), ...rows.map((x) => src[1].map((k) => cell(x[k])).join(','))].join('\n'));
}));
