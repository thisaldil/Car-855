import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../models/index.js';
import { validate } from '../middleware/validate.js';
import { protect, signToken, cookieOptions } from '../middleware/auth.js';
import { AppError, asyncHandler, ok } from '../utils/helpers.js';
import { sendEmail, templates } from '../services/email.js';
import { env } from '../config/env.js';

const r = Router();
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');
const password = z.string().min(8, 'At least 8 characters').max(72).regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number');
const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email(), phone: z.string().trim().min(7).max(20).optional(), password });
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

r.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email.toLowerCase() })) throw new AppError('An account with this email already exists', 409);
  const user = new User({ ...req.body, role: 'customer' }); // role can never be set by the client
  const raw = user.createToken('verifyTokenHash');
  await user.save();
  await sendEmail(user.email, ...templates.welcome(user.name, `${env.clientUrl}/verify-email?token=${raw}&email=${encodeURIComponent(user.email)}`));
  res.cookie('token', signToken(user._id), cookieOptions());
  ok(res, user, {}, 201);
}));

r.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new AppError('Invalid email or password', 401);
  if (user.status !== 'active') throw new AppError('This account is suspended', 403);
  res.cookie('token', signToken(user._id), cookieOptions());
  ok(res, user);
}));

r.post('/logout', (_req, res) => { res.clearCookie('token', cookieOptions()); ok(res, null); });
r.get('/me', protect, (req, res) => ok(res, req.user));

r.post('/verify-email', asyncHandler(async (req, res) => {
  const { token, email } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase(), verifyTokenHash: hash(String(token)) }).select('+verifyTokenHash');
  if (!user) throw new AppError('Invalid or expired verification link', 400);
  user.emailVerified = true; user.verifyTokenHash = undefined; await user.save();
  ok(res, { verified: true });
}));

r.post('/forgot-password', validate(z.object({ email: z.string().email() })), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (user) {
    const raw = user.createToken('resetTokenHash');
    user.resetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();
    await sendEmail(user.email, ...templates.reset(user.name, `${env.clientUrl}/reset-password?token=${raw}&email=${encodeURIComponent(user.email)}`));
  }
  ok(res, { message: 'If that email exists, a reset link has been sent.' }); // same response either way
}));

r.post('/reset-password', validate(z.object({ email: z.string().email(), token: z.string().min(10), password })), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase(), resetTokenHash: hash(req.body.token), resetExpires: { $gt: new Date() } }).select('+resetTokenHash +resetExpires');
  if (!user) throw new AppError('Invalid or expired reset link', 400);
  user.password = req.body.password; user.resetTokenHash = undefined; user.resetExpires = undefined;
  await user.save();
  ok(res, { message: 'Password updated. Please log in.' });
}));

r.put('/profile', protect, validate(z.object({ name: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().max(20).optional() })), asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body); await req.user.save(); ok(res, req.user);
}));
r.put('/password', protect, validate(z.object({ currentPassword: z.string(), newPassword: password })), asyncHandler(async (req, res) => {
  const u = await User.findById(req.user._id).select('+password');
  if (!(await u.comparePassword(req.body.currentPassword))) throw new AppError('Current password is incorrect', 401);
  u.password = req.body.newPassword; await u.save(); ok(res, { message: 'Password changed' });
}));
export default r;
