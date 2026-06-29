import type { TRPC_ERROR_CODE_KEY } from "@trpc/server";
import { Data } from "effect";

export class TRPCError extends Data.TaggedError("TRPCError")<{
  code: TRPC_ERROR_CODE_KEY;
  message: string;
  cause?: unknown;
}> {}

export class ExternalServiceError extends Data.TaggedError(
  "ExternalServiceError",
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}
