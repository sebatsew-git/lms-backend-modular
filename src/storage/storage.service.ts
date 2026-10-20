/**
 * Provides file storage and cleanup operations for uploaded materials. Resolves stored file metadata and paths for feature services.
 */

import fs from 'fs';
import path from 'path';
import { env } from '../common/config/env';
import { NotFoundError } from '../common/errors/AppError';
import type { StorageConfig, StoredFileMeta } from './storage.types';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'application/zip',
];

export const storageConfig: StorageConfig = {
  driver: 'local',
  uploadDir: path.resolve(process.cwd(), env.UPLOAD_DIR),
  maxFileSize: env.MAX_FILE_SIZE,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
};

/** Creates the upload directory on first import so multer never fails on a cold start. */
export const ensureUploadDir = () => {
  if (!fs.existsSync(storageConfig.uploadDir)) {
    fs.mkdirSync(storageConfig.uploadDir, { recursive: true });
  }
  return storageConfig.uploadDir;
};

export const uploadRoot = ensureUploadDir();

/** Public URL for a stored file. */
export const buildFileUrl = (filename: string) => `/uploads/${filename}`;

/** Resolve a stored filename to an absolute path (guards against traversal). */
export const resolveUploadPath = (filename: string) => {
  const safeName = path.basename(filename);
  const full = path.join(uploadRoot, safeName);
  if (!full.startsWith(uploadRoot)) throw new NotFoundError('Invalid file path');
  return full;
};

export const fileExists = (filename: string) => fs.existsSync(resolveUploadPath(filename));

export const deleteUploadedFile = async (filename: string) => {
  const full = resolveUploadPath(filename);
  if (!fs.existsSync(full)) throw new NotFoundError('File not found');
  await fs.promises.unlink(full);
  return { filename };
};

export const fileMetadata = (file: Express.Multer.File): StoredFileMeta => ({
  fileUrl: buildFileUrl(file.filename),
  fileName: file.originalname,
  mimeType: file.mimetype,
  fileSize: file.size,
});

/** Strips the `/uploads/` prefix from a stored URL back to a bare filename. */
export const filenameFromUrl = (fileUrl: string) => path.basename(fileUrl);
