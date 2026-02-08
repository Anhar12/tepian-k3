import type { MiddlewareHandler } from "hono";
import { env } from "@/env";

export const secureHeaders = (): MiddlewareHandler => {
  return async (c, next) => {
    await next();

    // Basic security headers
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "0"); // Disabled - modern browsers don't need this
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    // Additional security headers
    c.header("X-Permitted-Cross-Domain-Policies", "none");
    c.header("Cross-Origin-Embedder-Policy", "require-corp");
    c.header("Cross-Origin-Opener-Policy", "same-origin");
    // Only set CORP if not already set by route handler (allows per-route override)
    if (!c.res.headers.get("Cross-Origin-Resource-Policy")) {
      c.header("Cross-Origin-Resource-Policy", "same-origin");
    }

    // Only set CSP if not already set by route handler (allows per-route override, e.g. nonce-based CSP)
    if (!c.res.headers.get("Content-Security-Policy")) {
      // Content Security Policy - stricter in production
      if (env.NODE_ENV === "production") {
        c.header(
          "Content-Security-Policy",
          [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https: wss:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join("; "),
        );
      } else {
        // Development - more permissive CSP for hot reload, dev tools
        c.header(
          "Content-Security-Policy",
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https: wss: ws:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        );
      }
    }

    if (env.NODE_ENV === "production") {
      // HSTS - only in production
      c.header(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
      );
    }
  };
};
