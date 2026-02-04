import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { handleTRPCError } from "@tepian-k3/utils/handle-trpc-error";
import { logError } from "@tepian-k3/services/logger";

/**
 * Wrapper around Effect.tryPromise that surfaces real errors as TRPCErrors
 * instead of letting them become Effect's opaque UnknownError.
 *
 * The shorthand `Effect.tryPromise(() => promise)` drops the rejection reason
 * in production, making debugging impossible. This ensures the original error
 * (or a meaningful message) always reaches the client.
 *
 * @example
 * ```ts
 * // Instead of:
 * yield* Effect.tryPromise(() => generatePdf({ ... }));
 *
 * // Use:
 * yield* tryPromise(
 *   () => generatePdf({ ... }),
 *   "Gagal menghasilkan PDF",
 * );
 * ```
 */
export function tryPromise<A>(
  fn: () => Promise<A>,
  message: string,
  code: TRPCError["code"] = "INTERNAL_SERVER_ERROR",
): Effect.Effect<A, TRPCError, never> {
  return Effect.tryPromise({
    try: fn,
    catch: (error) => {
      logError("tryPromise", message, { error });
      return handleTRPCError(error, message, code);
    },
  });
}
