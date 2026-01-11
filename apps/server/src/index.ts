import "dotenv/config";
import * as z from "zod";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import fs from "fs/promises";
import { lookup } from "mime-types";
import { serve } from "@hono/node-server";
import { env } from "env";
import { createTRPCContext } from "@tepian-k3/api";
import { appRouter } from "@tepian-k3/api/root";
import path from "path";
import {
  initializeEventBus,
  shutdownEventBus,
} from "@tepian-k3/services/notifications";

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

const app = new Hono();

const uploadsDir = env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createTRPCContext(context);
    },
  })
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
  } catch (error) {
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
  } catch (error) {
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
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await shutdownEventBus();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await shutdownEventBus();
  process.exit(0);
});
