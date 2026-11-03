import { Router } from 'express';
import { z } from 'zod';
import { ImportRequest, User } from '../models/index.js';
import { protect, can, isStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, ok, paginate, pageMeta, IMPORT_STATUSES } from '../utils/helpers.js';
import { notify } from '../services/notify.js';
import { templates } from '../services/email.js';
import { env } from '../config/env.js';

const r = Router();
const oid = z.string().regex(/^[a-f\d]{24}$/i);
const createSchema = z.object({
  preferredVehicle: z.object({
    make: z.string().trim().min(1).max(50), model: z.string().trim().min(1).max(50),
    manufacturingYear: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
    grade: z.string().trim().max(50).optional(), fuelType: z.string().max(30).optional(), transmission: z.string().max(30).optional(),
  }),
  auctionListing: oid.optional(),
  budget: z.coerce.number().positive().optional(),
  timeframe: z.string().trim().max(100).optional(),
  requirements: z.string().trim().max(3000).optional(),
});
r.use(protect);

r.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const doc = await ImportRequest.create({ ...req.body, customer: req.user._id, progressHistory: [{ status: 'Submitted', note: 'Request submitted', changedBy: req.user._id }] });
  await notify(req.user, { title: 'Import request received', message: `Request ${doc.requestNo} was submitted.`, type: 'import', entity: { kind: 'ImportRequest', id: doc._id }, email: templates.importReceived(req.user.name, doc.requestNo, `${env.clientUrl}/account/imports`) });
  ok(res, doc, {}, 201);
}));

r.get('/', asyncHandler(async (req, res) => {
  const f = isStaff(req.user) ? {} : { customer: req.user._id };
  if (req.query.status && IMPORT_STATUSES.includes(req.query.status)) f.status = req.query.status;
  const { page, limit, skip } = paginate(req.query, 100);
  const [items, total] = await Promise.all([
    ImportRequest.find(f).select('-documents.publicId').populate('customer', 'name email phone').populate('assignedStaff', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ImportRequest.countDocuments(f),
  ]);
  ok(res, items, pageMeta(total, page, limit));
}));

const load = async (req) => {
  const d = await ImportRequest.findById(req.params.id).populate('customer', 'name email phone').populate('assignedStaff', 'name');
  if (!d || (!isStaff(req.user) && String(d.customer._id) !== String(req.user._id))) throw new AppError('Import request not found', 404);
  return d;
};
r.get('/:id', asyncHandler(async (req, res) => ok(res, await load(req))));

r.put('/:id', can('imports'), validate(z.object({ assignedStaff: oid.nullable().optional(), requirements: z.string().max(3000).optional(), budget: z.coerce.number().positive().optional() })), asyncHandler(async (req, res) => {
  const d = await load(req);
  if (req.body.assignedStaff) {
    const staff = await User.findOne({ _id: req.body.assignedStaff, role: { $in: ['staff', 'admin'] } });
    if (!staff) throw new AppError('Assigned user is not a staff member', 422);
  }
  Object.assign(d, req.body); await d.save(); ok(res, d);
}));

r.patch('/:id/status', can('imports'), validate(z.object({ status: z.enum(IMPORT_STATUSES), note: z.string().max(500).optional() })), asyncHandler(async (req, res) => {
  const d = await load(req);
  if (d.status === req.body.status) return ok(res, d);
  d.status = req.body.status;
  d.progressHistory.push({ status: req.body.status, note: req.body.note, changedBy: req.user._id });
  await d.save();
  await notify(d.customer, { title: 'Import status updated', message: `${d.requestNo} is now "${d.status}".`, type: 'import', entity: { kind: 'ImportRequest', id: d._id }, email: templates.importStatus(d.customer.name, d.requestNo, d.status, `${env.clientUrl}/account/imports`) });
  ok(res, d);
}));

// Customers may cancel their own request while it has not been purchased
r.patch('/:id/cancel', asyncHandler(async (req, res) => {
  const d = await load(req);
  if (String(d.customer._id) !== String(req.user._id)) throw new AppError('Only the customer can cancel', 403);
  const idx = IMPORT_STATUSES.indexOf(d.status);
  if (idx >= IMPORT_STATUSES.indexOf('Vehicle Purchased') || d.status === 'Cancelled') throw new AppError('This request can no longer be cancelled online', 409);
  d.status = 'Cancelled'; d.progressHistory.push({ status: 'Cancelled', note: 'Cancelled by customer', changedBy: req.user._id });
  await d.save(); ok(res, d);
}));
export default r;
