import { TRPCError } from "@trpc/server";

/**
 * Preserves TRPCError instances, wraps unknown errors
 * Use in Effect.tryPromise catch blocks
 *
 * @example
 * ```ts
 * yield* Effect.tryPromise({
 *   try: () => db.transaction(...),
 *   catch: (error) => handleTRPCError(error, "Gagal mengassign alat")
 * });
 * ```
 */
export function handleTRPCError(
  error: unknown,
  message: string,
  code: TRPCError["code"] = "INTERNAL_SERVER_ERROR",
): TRPCError {
  // Preserve TRPCError instances
  if (error instanceof TRPCError) {
    return error;
  }

  // Wrap unknown errors
  return new TRPCError({
    code,
    message,
    cause: error,
  });
}
