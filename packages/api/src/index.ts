/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { validateToken } from "@tepian-k3/auth/utils";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import type { Context as HonoContext } from "hono";
import permissionQueries from "@tepian-k3/queries/permission.queries";
import { Effect } from "effect";

/**
 * Isomorphic Session getter for API requests
 * - Expo requests will have a session token in the Authorization header
 * - Next.js requests will have a session token in cookies
 */
const isomorphicGetSession = async (token: string) => {
  if (token) {
    const sessionToken = token.split(" ")[1];
    if (sessionToken) {
      const { session, user } = await validateToken(sessionToken);
      return { session, user };
    }
  }

  // Then try cookie
  const cookieHeader = token ?? null;
  if (cookieHeader) {
    const sessionToken = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (sessionToken) {
      const { session, user } = await validateToken(sessionToken);
      return { session, user };
    }
  }

  return null;
};

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (context: HonoContext) => {
  const Authorization = context.req.header("Authorization") || "";

  const data = await isomorphicGetSession(Authorization);
  return {
    session: data?.session,
    user: data?.user,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? z.treeifyError(error.cause) : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Authenticated procedure
 *
 * This is the same as `publicProcedure`, but it requires the user to be logged in. If the user is
 * not logged in, this procedure will throw an error.
 */
/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.user || !ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Anda harus masuk untuk mengakses sumber daya ini.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        session: ctx.session,
      },
    });
  });

export const withPermission = (permission: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasPermission = await Effect.runPromise(
      permissionQueries.userHasPermission(ctx.user.id, permission)
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk mengakses sumber daya ini.",
      });
    }

    return next();
  });

export const withRole = (role: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasRole = await Effect.runPromise(
      permissionQueries.userHasRole(ctx.user.id, role)
    );

    if (!hasRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk mengakses sumber daya ini.",
      });
    }

    return next();
  });

export const withAnyRole = (roleNames: string[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasRole = await Effect.runPromise(
      permissionQueries.userHasAnyRole(ctx.user.id, roleNames)
    );

    if (!hasRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk mengakses sumber daya ini.",
      });
    }

    return next();
  });

export const withAllRoles = (roleNames: string[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasRole = await Effect.runPromise(
      permissionQueries.userHasAllRoles(ctx.user.id, roleNames)
    );

    if (!hasRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk mengakses sumber daya ini.",
      });
    }

    return next();
  });
