/**
 * File size limits for uploads, shared across every file-upload form.
 *
 * These mirror the backend's core.constants.MAX_IMAGE_FILE_SIZE_MB /
 * MAX_DOCUMENT_FILE_SIZE_MB settings, which enforce the same limits
 * server-side.
 */
export const MAX_IMAGE_FILE_SIZE_BYTES = 5_000_000; // 5MB
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10_000_000; // 10MB
