import { ZodError } from 'zod';
import { isProd } from '../config/env.js';
export const notFound = (req, _res, next) => next(Object.assign(new Error(`Route not found: ${req.originalUrl}`), { status: 404 }));
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500, message = err.message, details = err.details;
  if (err instanceof ZodError) { status = 422; message = 'Validation failed'; details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })); }
  else if (err.name === 'ValidationError') { status = 422; message = 'Validation failed'; details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })); }
  else if (err.name === 'CastError') { status = 400; message = `Invalid ${err.path}`; }
  else if (err.code === 11000) { status = 409; message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ')}`; }
  else if (err.code === 'LIMIT_FILE_SIZE') { status = 413; message = 'File too large'; }
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message: status >= 500 && isProd ? 'Internal server error' : message, details });
}
