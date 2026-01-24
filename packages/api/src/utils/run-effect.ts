import { TRPCError } from "@trpc/server";
import { Cause, Effect, Exit } from "effect";

export async function runEffect<A, E>(
  effect: Effect.Effect<A, E, never>,
  fallbackMessage = "Terjadi kesalahan pada server."
): Promise<A> {
  const result = await Effect.runPromiseExit(effect);

  if (Exit.isFailure(result)) {
    const error = Cause.squash(result.cause) as TRPCError;
    throw new TRPCError({
      code: error.code ?? "INTERNAL_SERVER_ERROR",
      message: error.message || fallbackMessage,
      cause: error,
    });
  }

  return result.value;
}
