import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import fs from "fs/promises";
import { lookup } from "mime-types";

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

app.get("/api/uploads/:folder/:filename", async (c) => {
  const folder = c.req.param("folder");
  const filename = c.req.param("filename");

  if (folder.includes("..") || filename.includes("..")) {
    return c.text("Invalid path", 400);
  }

  const filePath = path.join(uploadsDir, folder, filename);

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

import { serve } from "@hono/node-server";
import { env } from "env";
import { createTRPCContext } from "@tepian-k3/api";
import { appRouter } from "@tepian-k3/api/root";
import path from "path";

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
