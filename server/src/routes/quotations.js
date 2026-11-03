import { Router } from 'express';
import { z } from 'zod';
import { Quotation, User } from '../models/index.js';
import { protect, can, isStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, ok, paginate, pageMeta } from '../utils/helpers.js';
import { notify } from '../services/notify.js';
import { templates } from '../services/email.js';
import { env } from '../config/env.js';

const r = Router();
const oid = z.string().regex(/^[a-f\d]{24}$/i);
const money = z.coerce.number().min(0);
const schema = z.object({ customer: oid, vehicle: oid.optional(), importRequest: oid.optional(), vehiclePrice: money, shippingCost: money.default(0), taxes: money.default(0), otherCharges: money.default(0), validityPeriod: z.coerce.number().int().min(1).max(90).default(7), notes: z.string().max(2000).optional() });
r.use(protect);

r.get('/', asyncHandler(async (req, res) => {
  const f = isStaff(req.user) ? {} : { customer: req.user._id, status: { $ne: 'draft' } }; // customers never see drafts
  const { page, limit, skip } = paginate(req.query, 100);
  const [items, total] = await Promise.all([
    Quotation.find(f).populate('vehicle', 'title slug').populate('customer', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Quotation.countDocuments(f),
  ]);
  ok(res, items, pageMeta(total, page, limit));
}));
const load = async (req) => {
  const q = await Quotation.findById(req.params.id).populate('vehicle', 'title slug').populate('customer', 'name email');
  const mine = q && String(q.customer._id) === String(req.user._id) && q.status !== 'draft';
  if (!q || (!isStaff(req.user) && !mine)) throw new AppError('Quotation not found', 404);
  return q;
};
r.get('/:id', asyncHandler(async (req, res) => ok(res, await load(req))));

r.post('/', can('quotations'), validate(schema), asyncHandler(async (req, res) => {
  if (!(await User.exists({ _id: req.body.customer, role: 'customer' }))) throw new AppError('Customer not found', 404);
  ok(res, await Quotation.create({ ...req.body, createdBy: req.user._id }), {}, 201);
}));
r.put('/:id', can('quotations'), validate(schema.partial().omit({ customer: true })), asyncHandler(async (req, res) => {
  const q = await load(req);
  if (q.status !== 'draft') throw new AppError('Only draft quotations can be edited', 409);
  Object.assign(q, req.body); await q.save(); ok(res, q);
}));

r.patch('/:id/status', validate(z.object({ status: z.enum(['sent', 'accepted', 'rejected', 'expired']) })), asyncHandler(async (req, res) => {
  const q = await load(req);
  const { status } = req.body;
  if (isStaff(req.user)) {
    if (!(req.user.role === 'admin' || req.user.permissions.includes('quotations'))) throw new AppError('Forbidden', 403);
    if (!['sent', 'expired'].includes(status)) throw new AppError('Staff can only send or expire quotations', 422);
  } else {
    if (!['accepted', 'rejected'].includes(status) || q.status !== 'sent') throw new AppError('Invalid status change', 422);
    const expires = q.createdAt.getTime() + q.validityPeriod * 86400000;
    if (Date.now() > expires) throw new AppError('This quotation has expired', 410);
  }
  q.status = status; await q.save();
  if (status === 'sent') await notify(q.customer, { title: 'New quotation', message: `Quotation ${q.quoteNo} is ready.`, type: 'quotation', entity: { kind: 'Quotation', id: q._id }, email: templates.quotation(q.customer.name, q.quoteNo, q.totalPrice, `${env.clientUrl}/account/quotations`) });
  ok(res, q);
}));
export default r;
