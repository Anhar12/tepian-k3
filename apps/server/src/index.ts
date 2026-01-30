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
} from "@tepian-k3/services/notifications";
import { logInfo } from "@tepian-k3/services/logger";
import { devRouter } from "./routes/dev";
import { secureHeaders } from "./middleware/secure-headers";
import { setDefaultOptions } from "date-fns";
import { id } from "date-fns/locale";

const redisConfig = {
  host: env.MEMURAI_HOST,
  port: parseInt(env.MEMURAI_PORT, 10),
  password: env.MEMURAI_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
};

initializeEventBus(redisConfig);

// Set Zod locale to Indonesian
z.config(z.locales.id());
// Set date-fns default locale to Indonesian
setDefaultOptions({ locale: id });

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

// Parse CORS origins (supports comma-separated values)
const corsOrigins: string[] = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

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
    allowHeaders: ["Content-Type", "Authorization", "X-Signature"],
    credentials: true,
  }),
);

app.route("/dev", devRouter);

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

app.get("/api/public/*", async (c) => {
  // Get the full path after /api/public/
  const fullPath = c.req.path.replace("/api/public/", "");
  const filePath = path.join("public", fullPath);

  try {
    await fs.access(filePath);

    const file = await fs.readFile(filePath);

    const mimeType = lookup(filePath) || "application/octet-stream";
    c.header("Content-Type", mimeType);
    c.header("Content-Length", file.length.toString());
    c.header("Cache-Control", "public, max-age=31536000");
    return c.body(file);
  } catch (_) {
    return c.text("File not found", 404);
  }
});

app.get("/api/uploads/*", async (c) => {
  // Get the full path after /api/uploads/
  const fullPath = c.req.path.replace("/api/uploads/", "");

  // Security check: prevent directory traversal
  if (fullPath.includes("..")) {
    return c.text("Invalid path", 400);
  }

  const filePath = path.join(uploadsDir, fullPath);

  try {
    await fs.access(filePath);

    const file = await fs.readFile(filePath);

    const mimeType = lookup(filePath) || "application/octet-stream";

    c.header("Content-Type", mimeType);
    c.header("Content-Length", file.length.toString());
    c.header("Cache-Control", "public, max-age=31536000");

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

// Graceful shutdown
process.on("SIGTERM", async () => {
  logInfo("Server", "Shutting down...");
  await shutdownEventBus();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logInfo("Server", "Shutting down...");
  await shutdownEventBus();
  process.exit(0);
});
