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
import { getEventBus } from "@tepian-k3/services/notifications";
import type { Permission, Role } from "@tepian-k3/constants";
import { getRateLimitConfig } from "@tepian-k3/constants";
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";
import type { RateLimiter } from "@tepian-k3/services/rate-limiter";
import { UAParser } from "ua-parser-js";
import { logWarn } from "@tepian-k3/services/logger";
import { getIdempotencyService } from "@tepian-k3/services/idempotency";
import { createHash } from "crypto";

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
  const hasAuthHeader = !!Authorization;

  const data = await isomorphicGetSession(Authorization);

  const eventBus = getEventBus();

  const ip =
    context.req.header("x-forwarded-for") ||
    context.req.header("x-real-ip") ||
    "";
  const userAgent = context.req.header("user-agent") || "";

  // Parse User-Agent to extract OS information
  const parser = new UAParser(userAgent);
  const os = parser.getOS();
  const osName = os.name || "";
  const osVersion = os.version || "";

  const idempotencyKey = context.req.header("X-Idempotency-Key") || null;

  return {
    session: data?.session,
    user: data?.user,
    hasAuthHeader,
    ip,
    userAgent,
    osName,
    osVersion,
    eventBus,
    idempotencyKey,
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
  sse: {
    ping: { enabled: true, intervalMs: 10_000 },
    client: { reconnectAfterInactivityMs: 30_000 },
  },
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
  const duration = end - start;

  if (t._config.isDev) {
    console.log(`[TRPC] ${path} took ${duration}ms to execute`);
  } else if (duration > 2000) {
    logWarn("tRPC", `Slow endpoint: ${path}`, { duration });
  }

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
 * @param {Permission} permission - The `permission` parameter in the `withPermission` function is a string
 * that represents the specific permission that a user must have in order to access a particular
 * resource or perform a certain action. This permission is checked against the user's permissions to
 * determine if they have the necessary authorization.
 */
export const withPermission = (permission: Permission) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasPermission = await Effect.runPromise(
      permissionQueries.userHasPermission(ctx.user.id, permission),
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
      permissionQueries.userHasRole(ctx.user.id, role),
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
      permissionQueries.userHasAnyRole(ctx.user.id, roleNames),
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
      permissionQueries.userHasAllRoles(ctx.user.id, roleNames),
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
 * Rate limiting middleware for public procedures
 *
 * @param limiter - The rate limiter instance to use (from rateLimiters presets or custom)
 * @param getKey - Function to generate the rate limit key from context (defaults to IP address)
 *
 * @example
 * ```typescript
 * // Using IP-based rate limiting with AUTH preset
 * export const loginRouter = createTRPCRouter({
 *   login: withRateLimit(rateLimiters.auth())
 *     .input(loginSchema)
 *     .mutation(async ({ input }) => { ... }),
 * });
 *
 * // Using user-based rate limiting
 * export const apiRouter = createTRPCRouter({
 *   getData: withRateLimit(
 *     rateLimiters.api(),
 *     (ctx) => `user:${ctx.user?.id || ctx.ip}`
 *   )
 *     .query(async ({ ctx }) => { ... }),
 * });
 *
 * // Using custom key function
 * export const emailRouter = createTRPCRouter({
 *   send: withRateLimit(
 *     rateLimiters.email(),
 *     (ctx, input) => `email:${input.to}`
 *   )
 *     .input(emailSchema)
 *     .mutation(async ({ input }) => { ... }),
 * });
 * ```
 */
export const withRateLimit = <TInput = unknown>(
  limiter: RateLimiter,
  getKey?: (
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    input?: TInput,
  ) => string,
) =>
  publicProcedure.use(async ({ ctx, next, getRawInput }) => {
    // Get the rate limit key
    const rawInput = await getRawInput();
    const key = getKey ? getKey(ctx, rawInput as TInput) : ctx.ip;

    // should skip rate limiting for localhost IPs or dev mode
    if (ctx.ip === "127.0.0.1" || ctx.ip === "::1" || t._config.isDev) {
      return next({ ctx });
    }

    // Check rate limit
    const result = await limiter.consume(key);

    if (!result.allowed) {
      const resetInSeconds = Math.ceil(result.resetMs / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Terlalu banyak permintaan. Coba lagi dalam ${resetInSeconds} detik.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          remaining: result.remaining,
          resetMs: result.resetMs,
        },
      },
    });
  });

/**
 * Rate limiting middleware for protected procedures
 *
 * Same as withRateLimit but requires authentication first.
 * Defaults to user-based rate limiting instead of IP-based.
 *
 * @param limiter - The rate limiter instance to use
 * @param getKey - Function to generate the rate limit key from context (defaults to user ID)
 *
 * @example
 * ```typescript
 * // User-based rate limiting with API preset
 * export const userRouter = createTRPCRouter({
 *   update: withProtectedRateLimit(rateLimiters.api())
 *     .input(updateSchema)
 *     .mutation(async ({ input, ctx }) => { ... }),
 * });
 *
 * // Custom key with user email
 * export const emailRouter = createTRPCRouter({
 *   send: withProtectedRateLimit(
 *     rateLimiters.email(),
 *     (ctx) => `email:${ctx.user.email}`
 *   )
 *     .input(emailSchema)
 *     .mutation(async ({ input }) => { ... }),
 * });
 * ```
 */
export const withProtectedRateLimit = <TInput = unknown>(
  limiter: RateLimiter,
  getKey?: (
    ctx: Awaited<ReturnType<typeof createTRPCContext>> & {
      user: NonNullable<Awaited<ReturnType<typeof createTRPCContext>>["user"]>;
    },
    input?: TInput,
  ) => string,
) =>
  protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
    // Get the rate limit key
    const rawInput = await getRawInput();
    const key = getKey
      ? getKey(ctx, rawInput as TInput)
      : `user:${ctx.user.id}`;

    // should skip rate limiting for localhost IPs or dev mode
    if (ctx.ip === "127.0.0.1" || ctx.ip === "::1" || t._config.isDev) {
      return next({ ctx });
    }

    // Check rate limit
    const result = await limiter.consume(key);

    if (!result.allowed) {
      const resetInSeconds = Math.ceil(result.resetMs / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Terlalu banyak permintaan. Coba lagi dalam ${resetInSeconds} detik.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          remaining: result.remaining,
          resetMs: result.resetMs,
        },
      },
    });
  });

/**
 * Role-based rate limiting middleware for protected procedures
 *
 * Automatically applies different rate limits based on user's roles.
 * Higher roles (admin, lab_manager) get more generous limits than basic users.
 *
 * @param operation - The type of operation (api, mutations, queries, uploads, email)
 * @param getKey - Optional function to generate custom rate limit key (defaults to user ID)
 *
 * @example
 * ```typescript
 * // Apply role-based API rate limits
 * export const userRouter = createTRPCRouter({
 *   // Admins get 100k/hr, users get 1k/hr, viewers get 100/hr
 *   getProfile: withRoleBasedRateLimit("api")
 *     .query(async ({ ctx }) => { ... }),
 *
 *   // Apply mutation-specific limits
 *   updateProfile: withRoleBasedRateLimit("mutations")
 *     .input(updateSchema)
 *     .mutation(async ({ input, ctx }) => { ... }),
 * });
 *
 * // Upload endpoints with role-based limits
 * export const documentRouter = createTRPCRouter({
 *   // Admins: 1000/hr, users: 20/hr, viewers: 5/hr
 *   upload: withRoleBasedRateLimit("uploads")
 *     .input(uploadSchema)
 *     .mutation(async ({ input }) => { ... }),
 * });
 * ```
 */
export const withRoleBasedRateLimit = <TInput = unknown>(
  operation: "api" | "mutations" | "queries" | "uploads" | "email",
  getKey?: (
    ctx: Awaited<ReturnType<typeof createTRPCContext>> & {
      user: NonNullable<Awaited<ReturnType<typeof createTRPCContext>>["user"]>;
    },
    input?: TInput,
  ) => string,
) =>
  protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
    // Get user's roles from context
    const userRoles = (ctx.user.roles || []) as Role[];

    // Get rate limit configuration based on highest role tier
    const config = getRateLimitConfig(userRoles, operation);

    // Create a rate limiter with the config
    const limiter = createRateLimiter(config);

    // Get the rate limit key
    const rawInput = await getRawInput();
    const key = getKey
      ? getKey(ctx, rawInput as TInput)
      : `${operation}:${ctx.user.id}`;

    // should skip rate limiting for localhost IPs or dev mode
    if (ctx.ip === "127.0.0.1" || ctx.ip === "::1" || t._config.isDev) {
      return next({ ctx });
    }

    // Check rate limit
    const result = await limiter.consume(key);

    if (!result.allowed) {
      const resetInSeconds = Math.ceil(result.resetMs / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Terlalu banyak permintaan. Coba lagi dalam ${resetInSeconds} detik.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          remaining: result.remaining,
          resetMs: result.resetMs,
          tier: userRoles.length > 0 ? "role-based" : "default",
        },
      },
    });
  });

/**
 * Combined permission and role-based rate limiting middleware
 *
 * Checks both permission access AND applies role-based rate limits in a single middleware.
 * This is useful when you need to protect an endpoint with both permission checks and rate limiting.
 *
 * @param permission - The permission required to access the endpoint
 * @param operation - The type of operation for rate limiting (api, mutations, queries, uploads, email)
 * @param getKey - Optional function to generate custom rate limit key (defaults to operation:userId)
 *
 * @example
 * ```typescript
 * // Protect audit logs with permission + role-based rate limiting
 * export const auditRouter = createTRPCRouter({
 *   getAll: withPermissionAndRateLimit("audits.read", "queries")
 *     .input(paginationSchema)
 *     .query(async ({ input }) => {
 *       return await auditQueries.getAll(input);
 *     }),
 *
 *   export: withPermissionAndRateLimit("audits.export", "api")
 *     .query(async () => {
 *       return await auditQueries.export();
 *     }),
 * });
 *
 * // Custom rate limit key
 * export const documentRouter = createTRPCRouter({
 *   upload: withPermissionAndRateLimit(
 *     "documents.create",
 *     "uploads",
 *     (ctx, input) => `upload:${ctx.user.id}:${input.entityType}`
 *   )
 *     .input(uploadSchema)
 *     .mutation(async ({ input }) => { ... }),
 * });
 * ```
 */
export const withPermissionAndRateLimit = <TInput = unknown>(
  permission: Permission,
  operation: "api" | "mutations" | "queries" | "uploads" | "email",
  getKey?: (
    ctx: Awaited<ReturnType<typeof createTRPCContext>> & {
      user: NonNullable<Awaited<ReturnType<typeof createTRPCContext>>["user"]>;
    },
    input?: TInput,
  ) => string,
) =>
  protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
    // 1. Check permission first
    const hasPermission = await Effect.runPromise(
      permissionQueries.userHasPermission(ctx.user.id, permission),
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk mengakses sumber daya ini.",
      });
    }

    // 2. Get user's roles from context
    const userRoles = (ctx.user.roles || []) as Role[];

    // 3. Get rate limit configuration based on highest role tier
    const config = getRateLimitConfig(userRoles, operation);

    // 4. Create a rate limiter with the config
    const limiter = createRateLimiter(config);

    // 5. Get the rate limit key
    const rawInput = await getRawInput();
    const key = getKey
      ? getKey(ctx, rawInput as TInput)
      : `${operation}:${ctx.user.id}`;

    // should skip rate limiting for localhost IPs or dev mode
    if (ctx.ip === "127.0.0.1" || ctx.ip === "::1" || t._config.isDev) {
      return next({ ctx });
    }

    // 6. Check rate limit
    const result = await limiter.consume(key);

    if (!result.allowed) {
      const resetInSeconds = Math.ceil(result.resetMs / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Terlalu banyak permintaan. Coba lagi dalam ${resetInSeconds} detik.`,
      });
    }

    // 7. Continue with the request
    return next({
      ctx: {
        ...ctx,
        rateLimit: {
          remaining: result.remaining,
          resetMs: result.resetMs,
          tier: userRoles.length > 0 ? "role-based" : "default",
        },
      },
    });
  });

/**
 * Idempotency wrapper for mutation handlers.
 *
 * Wraps a mutation handler to provide request deduplication.
 * Uses `X-Idempotency-Key` header (set automatically by the frontend tRPC client).
 *
 * - If no key is provided, the handler executes normally (pass-through).
 * - If a key exists with status "completed", returns the cached response.
 * - If a key exists with status "processing", throws CONFLICT (409).
 * - If a key exists with status "failed", deletes it and re-executes.
 * - On success, caches the response for the configured TTL.
 *
 * @param handler - The original mutation handler function
 * @param config - Optional config: `{ ttl: number }` in seconds (default: 86400 = 24h)
 *
 * @example
 * ```typescript
 * createOrder: withProtectedRateLimit(rateLimiters.moderate())
 *   .input(orderSchema)
 *   .mutation(withIdempotency(async ({ input, ctx }) => {
 *     // ... original handler ...
 *     return { success: true };
 *   })),
 *
 * // With custom TTL (5 minutes)
 * insertCartItem: withProtectedRateLimit(rateLimiters.lenient())
 *   .input(cartSchema)
 *   .mutation(withIdempotency(async ({ input, ctx }) => {
 *     // ...
 *   }, { ttl: 300 })),
 * ```
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createInputFingerprint(input: unknown, path: string): string {
  const hash = createHash("sha256");
  hash.update(path + ":" + JSON.stringify(input ?? ""));
  return hash.digest("hex");
}

export function withIdempotency<
  TInput,
  TOutput,
  TOpts extends {
    input: TInput;
    ctx: {
      idempotencyKey?: string | null;
      user?: { id: string } | null;
      ip?: string;
    };
  },
>(
  handler: (opts: TOpts) => Promise<TOutput>,
  config?: { ttl?: number },
): (opts: TOpts) => Promise<TOutput> {
  const ttl = config?.ttl ?? 86400;

  return async (opts: TOpts) => {
    const { ctx } = opts;
    const idempotencyKey = ctx.idempotencyKey;

    // No key provided — pass through to handler
    if (!idempotencyKey) {
      return handler(opts);
    }

    // Validate UUID format
    if (!UUID_REGEX.test(idempotencyKey)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Format Idempotency-Key tidak valid. Gunakan UUID.",
      });
    }

    const service = getIdempotencyService();
    const userId = ctx.user?.id ?? ctx.ip ?? "anonymous";
    const storageKey = `${userId}:${idempotencyKey}`;

    // Generate input fingerprint for verification
    const fingerprint = createInputFingerprint(opts.input, storageKey);

    // Check for existing record
    const existing = await service.check(storageKey);

    if (existing) {
      // Still processing (concurrent duplicate request)
      if (existing.status === "processing") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Permintaan sebelumnya dengan kunci yang sama sedang diproses. Silakan tunggu.",
        });
      }

      // Completed — return cached response
      if (existing.status === "completed" && existing.response) {
        // Verify input fingerprint matches
        if (existing.fingerprint !== fingerprint) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message:
              "Kunci idempotency sudah digunakan dengan input yang berbeda.",
          });
        }
        return JSON.parse(existing.response) as TOutput;
      }

      // Failed — allow retry by deleting old entry
      if (existing.status === "failed") {
        await service.delete(storageKey);
      }
    }

    // Acquire processing lock
    const acquired = await service.acquireLock(storageKey, {
      status: "processing",
      response: null,
      error: null,
      createdAt: Date.now(),
      completedAt: null,
      path: storageKey,
      fingerprint,
    });

    if (!acquired) {
      // Race condition: another request acquired the lock
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Permintaan sebelumnya dengan kunci yang sama sedang diproses. Silakan tunggu.",
      });
    }

    try {
      const result = await handler(opts);

      // Cache the successful response
      await service.markCompleted(storageKey, JSON.stringify(result), ttl);

      return result;
    } catch (error) {
      // Mark as failed so the same key can be retried
      const errorMessage =
        error instanceof TRPCError
          ? JSON.stringify({ code: error.code, message: error.message })
          : "Unknown error";
      await service.markFailed(storageKey, errorMessage, ttl);
      throw error;
    }
  };
}
