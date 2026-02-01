import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Request timeout middleware
 * Aborts requests that take longer than the specified timeout
 */
export const timeout = (ms: number = 30000): MiddlewareHandler => {
  return async (c, next) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, ms);

    // Store the original signal if any
    const originalSignal = c.req.raw.signal;

    // Create a combined abort handler
    const abortHandler = () => {
      clearTimeout(timeoutId);
    };

    if (originalSignal) {
      originalSignal.addEventListener("abort", abortHandler);
    }

    try {
      // Race between the actual request and timeout
      const result = await Promise.race([
        next(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(
              new HTTPException(408, {
                message: "Request timeout",
              }),
            );
          });
        }),
      ]);

      return result;
    } finally {
      clearTimeout(timeoutId);
      if (originalSignal) {
        originalSignal.removeEventListener("abort", abortHandler);
      }
    }
  };
};
