import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// 4MB, not 5 — Vercel's serverless functions cap request bodies around
// 4.5MB on the free tier, so this stays safely under that platform limit
// regardless of what storage provider is on the other end.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// Memory storage, not disk — Vercel's filesystem is read-only outside
// /tmp, so the file is held in memory just long enough to stream it to
// Cloudinary, never written to disk at all.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  },
});

export function uploadBufferToCloudinary(buffer, folder = 'expense-tracker') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}
