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
import { parseAndValidateSafe } from "./utils/form-data-parser";

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

/**
 * Custom tRPC procedure that accepts FormData
 * Use this instead of .input() for FormData endpoints
 */
export const formDataProcedure = <T extends z.ZodTypeAny>(schema: T) =>
  t.middleware(async (opts) => {
    const { getRawInput, next } = opts;
    const rawInput = await getRawInput();

    if (!(rawInput instanceof FormData)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Expected FormData input",
      });
    }

    const parsed = parseAndValidateSafe(rawInput, schema);

    if (!parsed.success) {
      // Format Zod errors into user-friendly messages
      const errors = parsed.error.issues.map((err) => {
        const field = err.path.join(".");
        return field ? `${field}: ${err.message}` : err.message;
      });

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: errors.join(", "),
        cause: parsed.error,
      });
    }

    return next({
      ctx: {
        input: parsed,
      },
    });
  });

/**
 * FormData input schema for tRPC procedures
 * This allows tRPC to properly type mutations that accept FormData
 */
export const formDataInput = z.custom<FormData>(
  (val) => val instanceof FormData,
  { message: "Expected FormData input" },
);

/**
 * The `withPermission` function checks if a user has a specific permission before allowing access to a
 * protected procedure.
 * @param {string} permission - The `permission` parameter in the `withPermission` function is a string
 * that represents the specific permission that a user must have in order to access a particular
 * resource or perform a certain action. This permission is checked against the user's permissions to
 * determine if they have the necessary authorization.
 */
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

    return next({
      ctx,
    });
  });

/**
 * The `withRole` function checks if a user has a specific role before allowing access to a protected
 * procedure.
 * @param {string} role - The `role` parameter in the `withRole` function is a string that represents
 * the role that a user must have in order to access a specific resource or perform a specific action.
 */
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

    return next({
      ctx,
    });
  });

/**
 * The function `withAnyRole` checks if a user has any of the specified roles before allowing access to
 * a protected procedure.
 * @param {string[]} roleNames - The `roleNames` parameter is an array of strings that represent the
 * roles that a user must have in order to access a particular resource or perform a specific action.
 */
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

    return next({
      ctx,
    });
  });

/**
 * The function `withAllRoles` checks if a user has all specified roles before allowing access to a
 * protected procedure.
 * @param {string[]} roleNames - The `roleNames` parameter is an array of strings that contains the
 * names of roles that a user must have in order to access a specific resource or perform a specific
 * action. The `withAllRoles` function checks if the user has all the specified roles before allowing
 * them to proceed.
 */
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

    return next({
      ctx,
    });
  });
