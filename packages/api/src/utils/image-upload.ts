import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { imageService } from "@tepian-k3/services/image";
import type { ImageConversionOptions } from "@tepian-k3/services/image";
import { InvalidImageError } from "@tepian-k3/services/image";
import {
  storageService,
  assertValidFileBuffer,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
} from "@tepian-k3/services/storage";
import { UploadFailedError } from "@tepian-k3/services/storage";
import type { UploadResult } from "@tepian-k3/services/storage";

interface ProcessAndUploadImageOptions {
  /** Storage folder name (e.g. "banners", "companies", "avatars") */
  folder: string;
  /** Max file size in bytes. Defaults to FILE_SIZE_LIMITS.IMAGE (5MB) */
  maxSize?: number;
  /** Allowed MIME types. Defaults to ALLOWED_MIME_TYPES.IMAGE */
  allowedMimeTypes?: readonly string[];
  /** WebP conversion options (quality, maxWidth, maxHeight, effort, etc.) */
  conversion?: Omit<ImageConversionOptions, "filename">;
}

/**
 * Validates, converts to WebP, and uploads an image file in one step.
 *
 * Combines the repeated pattern of:
 * 1. File → Buffer conversion
 * 2. File validation (size, MIME type, magic bytes)
 * 3. WebP conversion via Sharp
 * 4. Storage upload
 *
 * @example
 * ```ts
 * const uploadedFile = yield* processAndUploadImage(ctx.input.data.picture, {
 *   folder: "banners",
 * });
 * // uploadedFile.key → storage key for database
 * ```
 *
 * @example With custom options
 * ```ts
 * const uploadedFile = yield* processAndUploadImage(ctx.input.data.picture, {
 *   folder: "avatars",
 *   maxSize: FILE_SIZE_LIMITS.AVATAR,
 *   conversion: { quality: 90, maxWidth: 512, maxHeight: 512 },
 * });
 * ```
 */
export function processAndUploadImage(
  file: File,
  options: ProcessAndUploadImageOptions,
): Effect.Effect<UploadResult, InvalidImageError | UploadFailedError> {
  const {
    folder,
    maxSize = FILE_SIZE_LIMITS.IMAGE,
    allowedMimeTypes = ALLOWED_MIME_TYPES.IMAGE,
    conversion = {},
  } = options;

  return Effect.gen(function* () {
    // 1. Convert File to Buffer
    const arrayBuffer = yield* Effect.promise(() => file.arrayBuffer());
    const buffer = Buffer.from(arrayBuffer);

    // 2. Validate file (size, MIME type, magic bytes)
    yield* Effect.tryPromise({
      try: () =>
        assertValidFileBuffer(buffer, file.name, file.type, {
          maxSize,
          allowedMimeTypes,
        }),
      catch: (error) => {
        if (error instanceof TRPCError) {
          return new InvalidImageError(error.message, error);
        }
        return new InvalidImageError("Validasi file gagal", error);
      },
    });

    // 3. Convert to WebP
    const converted = yield* imageService.convertToWebP(buffer, {
      quality: 80,
      effort: 4,
      ...conversion,
      filename: file.name,
    });

    // 4. Upload to storage
    const uploaded = yield* storageService.upload(converted.buffer, {
      filename: converted.filename,
      folder,
    });

    return uploaded;
  });
}

/**
 * Conditionally processes and uploads an image if the file is present.
 * Returns the storage key or undefined.
 *
 * Useful for update mutations where the image field is optional.
 *
 * @example
 * ```ts
 * const imageKey = yield* processAndUploadImageIfPresent(
 *   ctx.input.data.picture,
 *   { folder: "banners" },
 * );
 * const result = yield* bannerQueries.updateBanner(ctx.input.data, imageKey);
 * ```
 */
export function processAndUploadImageIfPresent(
  file: File | undefined | null,
  options: ProcessAndUploadImageOptions,
): Effect.Effect<string | undefined, InvalidImageError | UploadFailedError> {
  return Effect.gen(function* () {
    if (!file) return undefined;

    const uploaded = yield* processAndUploadImage(file, options);
    return uploaded.key;
  });
}

/**
 * Validates, converts to WebP, and uploads multiple image files with controlled concurrency.
 * Returns an array of storage keys in the same order as the input files.
 *
 * Uses `concurrency: 2` by default to balance speed vs CPU usage
 * (Sharp WebP conversion is CPU-intensive).
 *
 * @example
 * ```ts
 * const keys = yield* processAndUploadImages(
 *   ctx.input.data.documentationFiles,
 *   { folder: "tool-documentations" },
 * );
 * ```
 *
 * @example With custom concurrency
 * ```ts
 * const keys = yield* processAndUploadImages(
 *   files,
 *   { folder: "gallery" },
 *   { concurrency: 3 },
 * );
 * ```
 */
export function processAndUploadImages(
  files: File[],
  options: ProcessAndUploadImageOptions,
  { concurrency = 2 }: { concurrency?: number } = {},
): Effect.Effect<string[], InvalidImageError | UploadFailedError> {
  return Effect.forEach(
    files,
    (file) =>
      Effect.map(processAndUploadImage(file, options), (result) => result.key),
    { concurrency },
  );
}

// ---------------------------------------------------------------------------
// General file upload helpers (no image conversion)
// ---------------------------------------------------------------------------

interface ProcessAndUploadFileOptions {
  /** Storage folder name (e.g. "documents/order/invoice", "payment-proofs") */
  folder: string;
  /** Max file size in bytes. Defaults to FILE_SIZE_LIMITS.DOCUMENT (50MB) */
  maxSize?: number;
  /** Allowed MIME types. Defaults to ALLOWED_MIME_TYPES.DOCUMENT */
  allowedMimeTypes?: readonly string[];
  /** Content type to store. Defaults to the file's own type */
  contentType?: string;
}

/**
 * Validates and uploads a file in one step (no image conversion).
 *
 * Combines the repeated pattern of:
 * 1. File → Buffer conversion
 * 2. File validation (size, MIME type, magic bytes)
 * 3. Storage upload
 *
 * @example
 * ```ts
 * const uploaded = yield* processAndUploadFile(ctx.input.data.file, {
 *   folder: "documents/order/invoice",
 * });
 * ```
 *
 * @example With custom options
 * ```ts
 * const uploaded = yield* processAndUploadFile(ctx.input.data.file, {
 *   folder: "payment-proofs",
 *   allowedMimeTypes: [...ALLOWED_MIME_TYPES.IMAGE, ...ALLOWED_MIME_TYPES.DOCUMENT],
 * });
 * ```
 */
export function processAndUploadFile(
  file: File,
  options: ProcessAndUploadFileOptions,
): Effect.Effect<UploadResult, TRPCError | UploadFailedError> {
  const {
    folder,
    maxSize = FILE_SIZE_LIMITS.DOCUMENT,
    allowedMimeTypes = ALLOWED_MIME_TYPES.DOCUMENT,
    contentType,
  } = options;

  return Effect.gen(function* () {
    // 1. Convert File to Buffer
    const arrayBuffer = yield* Effect.promise(() => file.arrayBuffer());
    const buffer = Buffer.from(arrayBuffer);

    // 2. Validate file (size, MIME type, magic bytes)
    yield* Effect.tryPromise({
      try: () =>
        assertValidFileBuffer(buffer, file.name, file.type, {
          maxSize,
          allowedMimeTypes,
        }),
      catch: (error) => {
        if (error instanceof TRPCError) return error;
        return new TRPCError({
          code: "BAD_REQUEST",
          message: "Validasi file gagal",
          cause: error,
        });
      },
    });

    // 3. Upload to storage
    const uploaded = yield* storageService.upload(buffer, {
      filename: file.name,
      folder,
      contentType: contentType ?? file.type,
    });

    return uploaded;
  });
}

/**
 * Conditionally validates and uploads a file if present.
 * Returns the storage key or undefined.
 *
 * Useful for update mutations where the file field is optional.
 *
 * @example
 * ```ts
 * const fileKey = yield* processAndUploadFileIfPresent(
 *   ctx.input.data.document,
 *   { folder: "tool-certifications" },
 * );
 * ```
 */
export function processAndUploadFileIfPresent(
  file: File | undefined | null,
  options: ProcessAndUploadFileOptions,
): Effect.Effect<string | undefined, TRPCError | UploadFailedError> {
  return Effect.gen(function* () {
    if (!file) return undefined;

    const uploaded = yield* processAndUploadFile(file, options);
    return uploaded.key;
  });
}
