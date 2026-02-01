import type { MiddlewareHandler } from "hono";
import { env } from "@/env";

export const secureHeaders = (): MiddlewareHandler => {
  return async (c, next) => {
    await next();

    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "0");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    // Content Security Policy
    c.header(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https: wss:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    );

    if (env.NODE_ENV === "production") {
      c.header(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
      );
    }
  };
};
