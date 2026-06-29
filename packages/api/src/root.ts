import { createCallerFactory, createTRPCRouter } from ".";
import { pelatihanRouter } from "./routers/pelatihan";
import { pengujianRouter } from "./routers/pengujian";
import { platformRouter } from "./routers/platform";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  platform: platformRouter,
  pengujian: pengujianRouter,
  pelatihan: pelatihanRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
