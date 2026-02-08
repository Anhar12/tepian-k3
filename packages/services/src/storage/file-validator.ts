/**
 * File Validation Utility
 *
 * Validates file uploads for security:
 * - File size limits
 * - MIME type whitelist
 * - Magic byte verification (using file-type package)
 * - Extension validation
 */

import { TRPCError } from "@trpc/server";
import { fileTypeFromBuffer } from "file-type";

// Maximum file sizes (in bytes)
export const FILE_SIZE_LIMITS = {
  /** Default max size: 10MB */
  DEFAULT: 10 * 1024 * 1024,
  /** Image max size: 5MB */
  IMAGE: 5 * 1024 * 1024,
  /** Document max size: 50MB */
  DOCUMENT: 50 * 1024 * 1024,
  /** Avatar max size: 2MB */
  AVATAR: 2 * 1024 * 1024,
} as const;

// Allowed MIME types by category
export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  /** Common safe types for general uploads */
  GENERAL: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ],
} as const;

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".dll",
  ".bat",
  ".cmd",
  ".sh",
  ".bash",
  ".ps1",
  ".vbs",
  ".js",
  ".jse",
  ".ws",
  ".wsf",
  ".msc",
  ".msi",
  ".msp",
  ".com",
  ".scr",
  ".hta",
  ".cpl",
  ".msc",
  ".jar",
  ".php",
  ".phtml",
  ".php3",
  ".php4",
  ".php5",
  ".asp",
  ".aspx",
  ".jsp",
  ".py",
  ".rb",
  ".pl",
];

export interface FileValidationOptions {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types */
  allowedMimeTypes?: readonly string[];
  /** Whether to verify magic bytes */
  verifyMagicBytes?: boolean;
  /** Custom error messages */
  messages?: {
    tooLarge?: string;
    invalidType?: string;
    invalidMagicBytes?: string;
    dangerousExtension?: string;
  };
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  detectedMimeType?: string;
  size?: number;
}

/**
 * Verify file content matches the claimed MIME type using file-type package
 * Returns the detected MIME type or null if detection failed
 */
async function detectFileType(
  buffer: Buffer,
): Promise<{ mime: string; ext: string } | null> {
  const result = await fileTypeFromBuffer(buffer);
  return result ? { mime: result.mime, ext: result.ext } : null;
}

/**
 * Check if detected MIME type is compatible with claimed MIME type
 * Handles cases where exact match isn't required (e.g., Office documents)
 */
function isMimeTypeCompatible(
  claimedMime: string,
  detectedMime: string | null,
): boolean {
  // If no detection result, we can't verify (allow for types file-type doesn't support)
  if (!detectedMime) {
    // SVG and some text-based formats can't be detected by magic bytes
    const undetectableTypes = ["image/svg+xml", "text/plain", "text/csv"];
    return undetectableTypes.includes(claimedMime);
  }

  // Exact match
  if (claimedMime === detectedMime) {
    return true;
  }

  // Office documents: both .docx and .xlsx are ZIP-based, file-type detects them correctly
  // but sometimes with slight variations in MIME type naming
  const officeZipTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
  ];
  if (
    officeZipTypes.includes(claimedMime) &&
    officeZipTypes.includes(detectedMime)
  ) {
    return true;
  }

  // Legacy Office documents (.doc, .xls)
  const legacyOfficeTypes = [
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
  ];
  if (legacyOfficeTypes.includes(claimedMime)) {
    // file-type may detect these as "application/x-cfb" (compound file binary)
    return (
      detectedMime === "application/x-cfb" ||
      legacyOfficeTypes.includes(detectedMime)
    );
  }

  return false;
}

/**
 * Check if filename has a dangerous extension
 */
function hasDangerousExtension(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();

  // Check for double extensions (e.g., file.php.jpg)
  const parts = lowerFilename.split(".");
  if (parts.length > 2) {
    for (let i = 0; i < parts.length - 1; i++) {
      const ext = `.${parts[i]}`;
      if (DANGEROUS_EXTENSIONS.includes(ext)) {
        return true;
      }
    }
  }

  // Check the final extension
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (lowerFilename.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate a file for upload
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {},
): FileValidationResult {
  const {
    maxSize = FILE_SIZE_LIMITS.DEFAULT,
    allowedMimeTypes = ALLOWED_MIME_TYPES.GENERAL,
    messages = {},
  } = options;

  // Check for dangerous extensions
  if (hasDangerousExtension(file.name)) {
    return {
      valid: false,
      error:
        messages.dangerousExtension ||
        "Jenis file tidak diizinkan untuk alasan keamanan",
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: messages.tooLarge || `Ukuran file maksimal ${maxSizeMB}MB`,
      size: file.size,
    };
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        messages.invalidType ||
        "Jenis file tidak diizinkan. Gunakan format yang didukung.",
      mimeType: file.type,
    };
  }

  return {
    valid: true,
    mimeType: file.type,
    size: file.size,
  };
}

/**
 * Validate a file buffer for upload (with magic byte verification using file-type)
 */
export async function validateFileBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options: FileValidationOptions = {},
): Promise<FileValidationResult> {
  const {
    maxSize = FILE_SIZE_LIMITS.DEFAULT,
    allowedMimeTypes = ALLOWED_MIME_TYPES.GENERAL,
    verifyMagicBytes = true,
    messages = {},
  } = options;

  // Check for dangerous extensions
  if (hasDangerousExtension(filename)) {
    return {
      valid: false,
      error:
        messages.dangerousExtension ||
        "Jenis file tidak diizinkan untuk alasan keamanan",
    };
  }

  // Check file size
  if (buffer.length > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: messages.tooLarge || `Ukuran file maksimal ${maxSizeMB}MB`,
      size: buffer.length,
    };
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error:
        messages.invalidType ||
        "Jenis file tidak diizinkan. Gunakan format yang didukung.",
      mimeType,
    };
  }

  // Verify magic bytes using file-type package
  if (verifyMagicBytes) {
    const detected = await detectFileType(buffer);
    const detectedMime = detected?.mime ?? null;

    if (!isMimeTypeCompatible(mimeType, detectedMime)) {
      return {
        valid: false,
        error:
          messages.invalidMagicBytes ||
          "Konten file tidak sesuai dengan jenis file yang diklaim",
        mimeType,
        detectedMimeType: detectedMime ?? undefined,
      };
    }
  }

  return {
    valid: true,
    mimeType,
    size: buffer.length,
  };
}

/**
 * Throw a TRPC error if file validation fails
 */
export function assertValidFile(
  file: File,
  options: FileValidationOptions = {},
): void {
  const result = validateFile(file, options);
  if (!result.valid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: result.error || "File tidak valid",
    });
  }
}

/**
 * Throw a TRPC error if file buffer validation fails
 */
export async function assertValidFileBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options: FileValidationOptions = {},
): Promise<void> {
  const result = await validateFileBuffer(buffer, filename, mimeType, options);
  if (!result.valid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: result.error || "File tidak valid",
    });
  }
}

export default {
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  validateFile,
  validateFileBuffer,
  assertValidFile,
  assertValidFileBuffer,
};
