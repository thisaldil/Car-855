export class AppError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const ok = (res, data, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra });

export const IMPORT_STATUSES = [
  'Submitted', 'Under Review', 'Vehicle Searching', 'Vehicle Found', 'Quotation Sent',
  'Awaiting Approval', 'Purchase Confirmed', 'Vehicle Purchased', 'Shipping',
  'Arrived in Sri Lanka', 'Customs Clearance', 'Ready for Delivery', 'Delivered', 'Cancelled',
];

export function paginate(query, max = 50) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(query.limit) || 12));
  return { page, limit, skip: (page - 1) * limit };
}
export const pageMeta = (total, page, limit) => ({ meta: { total, page, limit, pages: Math.ceil(total / limit) } });
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Strip Mongo operator keys ($...) and dotted keys from user input (NoSQL injection guard)
export function sanitize(obj) {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = sanitize(v);
    }
    return out;
  }
  return obj;
}
