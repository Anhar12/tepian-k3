import "dotenv/config";
import * as z from "zod";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import fs from "fs/promises";
import { lookup } from "mime-types";
import { serve } from "@hono/node-server";
import { env } from "@/env";
import { createTRPCContext } from "@tepian-k3/api";
import { appRouter } from "@tepian-k3/api/root";
import path from "path";
import {
  initializeEventBus,
  shutdownEventBus,
  isEventBusReady,
} from "@tepian-k3/services/notifications";
import {
  initializeTokenBlacklist,
  shutdownTokenBlacklist,
} from "@tepian-k3/services/token-blacklist";
import { shutdownIdempotencyService } from "@tepian-k3/services/idempotency";
import { logInfo, logWarn } from "@tepian-k3/services/logger";
import { db, sql } from "@tepian-k3/db/client";
import { devRouter } from "./routes/dev";
import { logsRouter } from "./routes/logs";
import { secureHeaders } from "./middleware/secure-headers";
import { timeout } from "./middleware/timeout";
import { setDefaultOptions } from "date-fns";
import { id } from "date-fns/locale";
import { registerEmailWorker } from "./workers/email.worker";
import { registerCleanupWorker } from "./workers/cleanup.worker";
import { queueService } from "@tepian-k3/services/queue";

const redisConfig = {
  host: env.MEMURAI_HOST,
  port: parseInt(env.MEMURAI_PORT, 10),
  password: env.MEMURAI_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
};

initializeEventBus(redisConfig);

// Initialize token blacklist for JWT revocation
initializeTokenBlacklist(redisConfig);

// Set Zod locale to Indonesian
z.config(z.locales.id());
// Set date-fns default locale to Indonesian
setDefaultOptions({ locale: id });

// Register Workers
registerEmailWorker();
registerCleanupWorker();

const app = new Hono();

const uploadsDir = env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

// Validate JWT secrets in production
if (env.NODE_ENV === "production") {
  const placeholders = ["your-secret", "change-this", "secret", "password"];
  const secrets = [env.JWT_SECRET, env.JWT_RESET_PASSWORD_SECRET];
  for (const secret of secrets) {
    if (placeholders.some((p) => secret.toLowerCase().includes(p))) {
      throw new Error(
        "JWT secrets contain placeholder values. Set secure secrets for production.",
      );
    }
  }
}

app.use(logger());
app.use(secureHeaders());
app.use(async (c, next) => {
  if (c.req.path.startsWith("/trpc/event.")) {
    return await next(); // SSE subscriptions are long-lived, skip timeout
  }
  return await timeout(30000)(c, next);
});

// Parse CORS origins (supports comma-separated values)
const corsOrigins: string[] = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

// Validate CORS_ORIGIN is set in production
if (env.NODE_ENV === "production" && corsOrigins.length === 0) {
  throw new Error(
    "CORS_ORIGIN must be set in production. Using '*' is not allowed.",
  );
}

const corsOrigin: string | string[] =
  corsOrigins.length === 1
    ? corsOrigins[0]!
    : corsOrigins.length > 1
      ? corsOrigins
      : "*";

app.use(
  "/*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Signature",
      "X-Idempotency-Key",
    ],
    credentials: true,
    exposeHeaders: ["X-Data-Source"],
  }),
);

// Only mount dev router in development
if (env.NODE_ENV === "development") {
  app.route("/dev", devRouter);
}

// Developer log viewer (auth handled inside router based on NODE_ENV)
app.route("/api/logs", logsRouter);

// Only for local testing
app.use("*", async (c, next) => {
  if (env.NODE_ENV === "development") {
    c.req.raw.headers.set("x-forwarded-for", "127.0.0.1"); // test IP
  }
  await next();
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createTRPCContext(context);
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/health", async (c) => {
  const startTime = Date.now();

  // Check database connectivity
  let dbStatus: "healthy" | "unhealthy" = "unhealthy";
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - dbStart;
    dbStatus = "healthy";
  } catch {
    dbStatus = "unhealthy";
  }

  // Check Redis connectivity
  const redisStatus: "healthy" | "unhealthy" = isEventBusReady()
    ? "healthy"
    : "unhealthy";

  const overallStatus =
    dbStatus === "healthy" && redisStatus === "healthy"
      ? "healthy"
      : "unhealthy";

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      redis: {
        status: redisStatus,
      },
    },
    responseTime: Date.now() - startTime,
  };

  return c.json(response, overallStatus === "healthy" ? 200 : 503);
});

app.get("/api/version", (c) => {
  return c.json({
    version: process.env.BUILD_VERSION ?? "unknown",
    buildTime: process.env.BUILD_TIME ?? new Date().toISOString(),
  });
});

app.get("/api/public/*", async (c) => {
  // Get the full path after /api/public/
  // ##################
  // authored (generated by gemini, Jun 16 2026 17:58 WITA)
  // ##################
  const reqPath = c.req.path.replace(/\/+/g, "/");
  const requestedPath = reqPath.replace("/api/public/", "");
  // ##################
  // end authored

  // Normalize the path to prevent directory traversal
  const normalizedPath = path
    .normalize(requestedPath)
    .replace(/^(\.\.[/\\])+/, "");
  const publicDir = path.resolve(process.cwd(), "public");
  const filePath = path.resolve(publicDir, normalizedPath);

  // Security check: prevent directory traversal (double check after normalization)
  if (!filePath.startsWith(publicDir + path.sep)) {
    logWarn("FileAccess", "Directory traversal attempt blocked", {
      requestedPath,
      normalizedPath,
      ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
    });
    return c.text("Invalid path", 400);
  }

  try {
    await fs.access(filePath);

    const file = await fs.readFile(filePath);

    const mimeType = lookup(filePath) || "application/octet-stream";
    c.header("Content-Type", mimeType);
    c.header("Content-Length", file.length.toString());
    c.header("Cache-Control", "public, max-age=31536000");
    c.header("Cross-Origin-Resource-Policy", "cross-origin");
    return c.body(file);
  } catch (_) {
    return c.text("File not found", 404);
  }
});

app.get("/api/uploads/*", async (c) => {
  // Get the full path after /api/uploads/
  // ##################
  // authored (generated by gemini, Jun 16 2026 17:59 WITA)
  // ##################
  const reqPath = c.req.path.replace(/\/+/g, "/");
  const requestedPath = reqPath.replace("/api/uploads/", "");
  // ##################
  // end authored

  // Normalize the path to prevent directory traversal
  const normalizedPath = path
    .normalize(requestedPath)
    .replace(/^(\.\.[/\\])+/, "");
  const resolvedUploadsDir = path.resolve(uploadsDir);
  const filePath = path.resolve(resolvedUploadsDir, normalizedPath);

  // Security check: prevent directory traversal (double check after normalization)
  if (!filePath.startsWith(resolvedUploadsDir + path.sep)) {
    logWarn("FileAccess", "Directory traversal attempt blocked", {
      requestedPath,
      normalizedPath,
      ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
    });
    return c.text("Invalid path", 400);
  }

  try {
    await fs.access(filePath);

    const file = await fs.readFile(filePath);

    const mimeType = lookup(filePath) || "application/octet-stream";

    c.header("Content-Type", mimeType);
    c.header("Content-Length", file.length.toString());
    c.header("Cache-Control", "public, max-age=31536000");
    // Allow cross-origin access for static uploads (frontend might be on different domain/port)
    // authored (generated by gemini, Jun 15 2026 00:50 WITA)
    c.header("Cross-Origin-Resource-Policy", "cross-origin");
    // end authored

    return c.body(file);
  } catch (_) {
    return c.text("File not found", 404);
  }
});

serve(
  {
    fetch: app.fetch,
    hostname: env.SERVER_HOSTNAME,
    port: env.SERVER_PORT || 3000,
  },
  (info) => {
    logInfo("Server", `Running on http://${env.SERVER_HOSTNAME}:${info.port}`);
  },
);

const shutdown = async () => {
  logInfo("Server", "Shutting down...");
  await shutdownEventBus();
  await shutdownTokenBlacklist();
  await shutdownIdempotencyService();
  await queueService.shutdown();
  process.exit(0);
};

// Graceful shutdown
process.on("SIGTERM", shutdown);

process.on("SIGINT", shutdown);
