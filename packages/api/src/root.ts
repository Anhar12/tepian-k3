import { createCallerFactory, createTRPCRouter } from ".";
import { authRouter } from "./routers/auth";
import { clusterRouter } from "./routers/cluster";
import { parameterRouter } from "./routers/parameter";
import { parameterCategoriesRouter } from "./routers/parameter-categories";
import { permissionRouters } from "./routers/permission";
import { roleRouters } from "./routers/role";
import { toolRouter } from "./routers/tool";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  role: roleRouters,
  permission: permissionRouters,
  tool: toolRouter,
  cluster: clusterRouter,
  parameterCategories: parameterCategoriesRouter,
  parameter: parameterRouter,
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
