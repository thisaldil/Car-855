import { Router } from 'express';
import { z } from 'zod';
import { Inquiry, Notification } from '../models/index.js';
import { protect, optionalAuth, can, isStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler, ok, paginate, pageMeta } from '../utils/helpers.js';
import { sendEmail, templates } from '../services/email.js';

const r = Router();
const schema = z.object({
  vehicle: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  inquiryType: z.enum(['general', 'quotation', 'details', 'test-drive']).default('general'),
  message: z.string().trim().min(5).max(3000),
  name: z.string().trim().max(100).optional(), email: z.string().email().optional(), phone: z.string().trim().max(20).optional(),
});

r.post('/', optionalAuth, validate(schema), asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.user) { body.customer = req.user._id; body.name ||= req.user.name; body.email ||= req.user.email; body.phone ||= req.user.phone; }
  else if (!body.name || !body.email) throw new AppError('Name and email are required', 422);
  const inq = await Inquiry.create(body);
  if (body.email) await sendEmail(body.email, ...templates.inquiry(body.name));
  ok(res, inq, {}, 201);
}));

r.use(protect);
r.get('/', asyncHandler(async (req, res) => {
  const f = isStaff(req.user) ? {} : { customer: req.user._id };
  if (req.query.status) f.status = req.query.status;
  const { page, limit, skip } = paginate(req.query, 100);
  const [items, total] = await Promise.all([
    Inquiry.find(f).populate('vehicle', 'title slug images').populate('assignedStaff', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Inquiry.countDocuments(f),
  ]);
  ok(res, items, pageMeta(total, page, limit));
}));
const load = async (req) => {
  const inq = await Inquiry.findById(req.params.id).populate('vehicle', 'title slug');
  if (!inq || (!isStaff(req.user) && String(inq.customer) !== String(req.user._id))) throw new AppError('Inquiry not found', 404); // ownership check
  return inq;
};
r.get('/:id', asyncHandler(async (req, res) => ok(res, await load(req))));
r.put('/:id', can('inquiries'), validate(z.object({ status: z.enum(['new', 'in-progress', 'resolved', 'closed']).optional(), assignedStaff: z.string().regex(/^[a-f\d]{24}$/i).optional(), note: z.string().max(1000).optional() })), asyncHandler(async (req, res) => {
  const inq = await load(req);
  const { note, ...rest } = req.body;
  Object.assign(inq, rest);
  if (note) inq.notes.push({ text: note, by: req.user._id });
  await inq.save(); ok(res, inq);
}));
r.delete('/:id', can('inquiries'), asyncHandler(async (req, res) => { await Inquiry.findByIdAndDelete(req.params.id); ok(res, null); }));
export default r;
