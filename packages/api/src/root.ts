import { createCallerFactory, createTRPCRouter } from ".";
import { konsultasiRouter } from "./routers/konsultasi";
import { pelatihanRouter } from "./routers/pelatihan";
import { pengujianRouter } from "./routers/pengujian";
import { platformRouter } from "./routers/platform";
import { ujiKompetensiRouter } from "./routers/uji-kompetensi";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  platform: platformRouter,
  pengujian: pengujianRouter,
  pelatihan: pelatihanRouter,
  konsultasi: konsultasiRouter,
  ujiKompetensi: ujiKompetensiRouter,
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
