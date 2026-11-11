import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { env, isProd } from '../config/env.js';
import { AppError } from '../utils/helpers.js';

cloudinary.config(env.cloudinary);

const IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
const DOC = [...IMAGE, 'application/pdf'];

const make = (allowed, maxMB) => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMB * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    if (!isProd) console.warn(`[upload] rejected "${file.originalname}" (${file.mimetype}); allowed: ${allowed.join(', ')}`);
    return cb(new AppError(`File type ${file.mimetype} is not allowed`, 415));
  },
});

export const imageUpload = make(IMAGE, 8);
export const docUpload = make(DOC, 10);

/**
 * Uploads an in-memory multer file to Cloudinary.
 * Cloudinary failures are re-thrown as AppError(502) with Cloudinary's own message,
 * so they are never mistaken for a client-side validation error.
 */
export function uploadBuffer(file, { folder, privateFile = false }) {
  if (!env.cloudinary.cloud_name) throw new AppError('File storage (Cloudinary) is not configured', 503);

  const safeName = crypto.randomBytes(12).toString('hex'); // never trust the original filename
  const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `cars855/${folder}`,
        public_id: safeName,
        resource_type: 'auto',
        type: privateFile ? 'private' : 'upload',
      },
      (err, r) => {
        if (err) {
          console.error('[upload] Cloudinary error:', err.message || err);
          return reject(new AppError(`Storage error: ${err.message || 'upload failed'}`, 502));
        }
        resolve({
          url: privateFile ? undefined : r.secure_url,
          publicId: r.public_id,
          resourceType: r.resource_type,
          ext,
          format: r.format,
        });
      },
    ).end(file.buffer);
  });
}

/** Short-lived download link for private assets. */
export const signedUrl = (publicId, format) =>
  cloudinary.utils.private_download_url(publicId, format, {
    type: 'private',
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });

/**
 * Removes an asset. Pass the same `type` it was uploaded with:
 *   destroy(id)                          public image/pdf
 *   destroy(id, { type: 'private' })     private document
 * Failures are logged, not thrown, so cleanup never masks the original error.
 */
export const destroy = (publicId, { type = 'upload', resourceType = 'image' } = {}) =>
  cloudinary.uploader
    .destroy(publicId, { type, resource_type: resourceType, invalidate: true })
    .catch((e) => console.error('[upload] destroy failed:', e.message || e));