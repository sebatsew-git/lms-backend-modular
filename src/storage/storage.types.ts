export interface StoredFileMeta {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export type StorageDriver = 'local';

export interface StorageConfig {
  driver: StorageDriver;
  uploadDir: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}
