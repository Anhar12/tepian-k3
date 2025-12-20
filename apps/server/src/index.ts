import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

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

import { serve } from "@hono/node-server";
import { env } from "env";
import { createTRPCContext } from "@tepian-k3/api";
import { appRouter } from "@tepian-k3/api/root";

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
