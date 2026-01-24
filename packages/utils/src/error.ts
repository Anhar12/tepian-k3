import type { TRPC_ERROR_CODE_KEY } from "@trpc/server";
import { Data } from "effect";

export class TRPCError extends Data.TaggedError("TRPCError")<{
  code: TRPC_ERROR_CODE_KEY;
  message: string;
  cause?: unknown;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  code: "NOT_FOUND";
  message: string;
  cause?: unknown;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  code: "UNAUTHORIZED";
  message: string;
  cause?: unknown;
}> {}
