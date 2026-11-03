import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from '../utils/helpers.js';

cloudinary.config(env.cloudinary);
const IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
const DOC = [...IMAGE, 'application/pdf'];

const make = (allowed, maxMB) => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMB * 1024 * 1024, files: 10 },
  fileFilter: (_r, f, cb) => (allowed.includes(f.mimetype) ? cb(null, true) : cb(new AppError(`File type ${f.mimetype} is not allowed`, 415))),
});
export const imageUpload = make(IMAGE, 8);
export const docUpload = make(DOC, 10);

export function uploadBuffer(file, { folder, privateFile = false }) {
  if (!env.cloudinary.cloud_name) throw new AppError('File storage (Cloudinary) is not configured', 503);
  const safeName = crypto.randomBytes(12).toString('hex'); // never trust the original filename
  const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `cars855/${folder}`, public_id: safeName, resource_type: 'auto', type: privateFile ? 'private' : 'upload' },
      (err, r) => (err ? reject(err) : resolve({ url: privateFile ? undefined : r.secure_url, publicId: r.public_id, ext, format: r.format })),
    ).end(file.buffer);
  });
}
export const signedUrl = (publicId, format) =>
  cloudinary.utils.private_download_url(publicId, format, { type: 'private', expires_at: Math.floor(Date.now() / 1000) + 300 });
export const destroy = (publicId) => cloudinary.uploader.destroy(publicId).catch(() => {});
