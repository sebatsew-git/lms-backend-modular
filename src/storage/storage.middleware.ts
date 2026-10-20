/**
 * Configures upload handling for files submitted through the API. Applies storage naming and validation rules to incoming multipart requests.
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { BadRequestError } from '../common/errors/AppError';
import { ensureUploadDir, storageConfig, ALLOWED_MIME_TYPES } from './storage.service';

const uploadDir = ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new BadRequestError(`Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: storageConfig.maxFileSize },
  fileFilter,
});

/** Convenience wrappers so routes read declaratively. */
export const uploadSingle = (field = 'file') => upload.single(field);
export const uploadArray = (field = 'files', maxCount = 5) => upload.array(field, maxCount);
