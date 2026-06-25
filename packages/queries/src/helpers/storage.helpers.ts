import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { storageService } from "@tepian-k3/services/storage";
import { logError } from "@tepian-k3/services/logger";
import { QueueName, queueService } from "@tepian-k3/services/queue";

/**
 * Deletes a previous file from storage given its URL by queuing a background job.
 *
 * Extracts the storage key from the URL, logs an error if extraction fails,
 * and enqueues a delete job. Safe to call with null/undefined — returns immediately.
 *
 * @example
 * ```ts
 * // After DB update succeeds, clean up old image
 * yield* deleteStorageFile(existingBanner.bannerUrl, "banner.queries");
 * ```
 *
 * @example Conditional cleanup in update mutations
 * ```ts
 * if (newImageKey && existing.imageUrl && newImageKey !== existing.imageUrl) {
 *   yield* deleteStorageFile(existing.imageUrl, "news.queries");
 * }
 * ```
 */
export function deleteStorageFile(
  url: string | null | undefined,
  caller: string,
): Effect.Effect<void, TRPCError> {
  return Effect.gen(function* () {
    if (!url) return;

    const key = storageService.getKeyFromUrl(url);

    if (!key) {
      logError(caller, "Failed to extract storage key from URL", { url });
      return yield* Effect.fail(
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus file sebelumnya.",
        }),
      );
    }

    // Queue deletion using BullMQ instead of inline delete
    yield* Effect.tryPromise({
      try: () => queueService.addJob(QueueName.CLEANUP, "delete-file", { key }),
      catch: (error) => {
        logError(caller, "Failed to queue file deletion job", { key, error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menjadwalkan pembersihan file lama.",
        });
      },
    });
  });
}

/**
 * Replaces an old file in storage with a new upload.
 *
 * Only deletes the old file if:
 * - A new key is provided
 * - The old URL exists
 * - The new key differs from the old URL's key
 *
 * @example
 * ```ts
 * // In update mutation after DB write succeeds
 * yield* replaceStorageFile(
 *   uploadedFile?.key,
 *   existingRecord.imageUrl,
 *   "user-company.queries",
 * );
 * ```
 */
export function replaceStorageFile(
  newKey: string | undefined | null,
  oldUrl: string | undefined | null,
  caller: string,
): Effect.Effect<void, TRPCError> {
  return Effect.gen(function* () {
    if (!newKey || !oldUrl) return;

    const oldKey = storageService.getKeyFromUrl(oldUrl);
    if (oldKey && oldKey !== newKey) {
      yield* deleteStorageFile(oldUrl, caller);
    }
  });
}
