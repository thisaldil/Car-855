import jwt from 'jsonwebtoken';
import { env, isProd } from '../config/env.js';
import { User } from '../models/index.js';
import { AppError, asyncHandler } from '../utils/helpers.js';

export const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
export const signToken = (id) => jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpires });

async function loadUser(req) {
  const header = req.headers.authorization;
  const token = req.cookies?.token || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(id);
    return user && user.status === 'active' ? user : null;
  } catch { return null; }
}
export const protect = asyncHandler(async (req, _res, next) => {
  const user = await loadUser(req);
  if (!user) throw new AppError('Please log in to continue', 401);
  req.user = user;
  next();
});
export const optionalAuth = asyncHandler(async (req, _res, next) => { req.user = await loadUser(req); next(); });
export const restrictTo = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new AppError('You do not have permission to perform this action', 403));
// Admin always passes; staff need the named permission
export const can = (permission) => (req, _res, next) => {
  const u = req.user;
  if (u?.role === 'admin' || (u?.role === 'staff' && u.permissions.includes(permission))) return next();
  next(new AppError('You do not have permission to perform this action', 403));
};
export const isStaff = (u) => u && ['admin', 'staff'].includes(u.role);
