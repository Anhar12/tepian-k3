import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "@tepian-k3/api/root";

/**
 * Per-operation idempotency keys keyed by tRPC operation id.
 * Cleared on completion/error/unsubscribe to avoid leaks.
 */
const idempotencyKeyByOp = new Map<number, string>();

/**
 * tRPC link that assigns a stable `X-Idempotency-Key` per mutation op.
 * This ensures retries of the same mutation reuse the same key.
 */
export const idempotencyLink: TRPCLink<AppRouter> =
  () =>
  ({ op, next }) => {
    if (op.type !== "mutation") return next(op);

    let key = idempotencyKeyByOp.get(op.id);
    if (!key) {
      key = crypto.randomUUID();
      idempotencyKeyByOp.set(op.id, key);
    }

    const nextOp = {
      ...op,
      context: {
        ...op.context,
        idempotencyKey: key,
      },
    };

    return observable((observer) => {
      const sub = next(nextOp).subscribe({
        next: (v) => observer.next(v),
        error: (err) => {
          idempotencyKeyByOp.delete(op.id);
          observer.error(err);
        },
        complete: () => {
          idempotencyKeyByOp.delete(op.id);
          observer.complete();
        },
      });

      return () => {
        idempotencyKeyByOp.delete(op.id);
        sub.unsubscribe();
      };
    });
  };
