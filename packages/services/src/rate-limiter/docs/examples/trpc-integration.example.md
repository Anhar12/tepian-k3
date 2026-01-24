/**
 * tRPC Integration Examples
 * Real-world examples of integrating rate limiter with existing tRPC routers
 */

import { createTRPCRouter, publicProcedure, protectedProcedure } from "@tepian-k3/api/trpc";
import { rateLimiters, createRateLimiter } from "@tepian-k3/services/rate-limiter";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

/**
 * Helper to get client IP from request
 */
function getClientIp(req: Request): string {
  return (
    req.header("x-forwarded-for")?.split(",")[0].trim() ||
    req.header("x-real-ip") ||
    "unknown"
  );
}

/**
 * Helper to format rate limit error message
 */
function formatRateLimitError(resetMs: number): string {
  const minutes = Math.ceil(resetMs / 60000);
  if (minutes > 60) {
    const hours = Math.ceil(minutes / 60);
    return `Try again in ${hours} hour${hours > 1 ? "s" : ""}`;
  }
  if (minutes > 1) {
    return `Try again in ${minutes} minutes`;
  }
  const seconds = Math.ceil(resetMs / 1000);
  return `Try again in ${seconds} seconds`;
}

/**
 * Example 1: Enhanced Auth Router with Rate Limiting
 */
export const authRouter = createTRPCRouter({
  /**
   * Login with rate limiting
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const limiter = rateLimiters.auth();
      const ip = getClientIp(ctx.req);

      // Rate limit by email
      const emailResult = await limiter.consume(`login:email:${input.email}`);
      if (!emailResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many login attempts for this email. ${formatRateLimitError(emailResult.resetMs)}`,
        });
      }

      // Rate limit by IP
      const ipResult = await limiter.consume(`login:ip:${ip}`);
      if (!ipResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many login attempts from your IP. ${formatRateLimitError(ipResult.resetMs)}`,
        });
      }

      // Authenticate user
      const result = await authenticateUser(input.email, input.password);

      if (!result.success) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Invalid credentials. ${emailResult.remaining} attempts remaining`,
        });
      }

      // Success - reset rate limits
      await limiter.reset(`login:email:${input.email}`);
      await limiter.reset(`login:ip:${ip}`);

      return result;
    }),

  /**
   * Register with rate limiting
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const limiter = createRateLimiter({
        points: 3,
        duration: 3600, // 3 registrations per hour
        blockDuration: 3600,
        strategy: "sliding-window",
      });

      const ip = getClientIp(ctx.req);

      // Rate limit registrations per IP
      const ipResult = await limiter.consume(`registration:ip:${ip}`);
      if (!ipResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many registration attempts. ${formatRateLimitError(ipResult.resetMs)}`,
        });
      }

      // Create user account
      const user = await createUser(input);

      return { success: true, userId: user.id };
    }),

  /**
   * Send OTP with rate limiting
   */
  sendOTP: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const otpLimiter = rateLimiters.otp();
      const emailLimiter = rateLimiters.email();
      const ip = getClientIp(ctx.req);

      // Check OTP rate limit
      const otpResult = await otpLimiter.consume(`otp:send:${input.email}`);
      if (!otpResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many OTP requests. ${formatRateLimitError(otpResult.resetMs)}`,
        });
      }

      // Check IP rate limit
      const ipResult = await otpLimiter.consume(`otp:send:ip:${ip}`);
      if (!ipResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many OTP requests from your IP. ${formatRateLimitError(ipResult.resetMs)}`,
        });
      }

      // Check email rate limit
      const emailResult = await emailLimiter.consume(`email:otp:${input.email}`);
      if (!emailResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Email rate limit exceeded",
        });
      }

      // Generate and send OTP
      const otp = await generateAndSendOTP(input.email);

      return {
        success: true,
        attemptsRemaining: otpResult.remaining,
        expiresInMinutes: 5,
      };
    }),

  /**
   * Verify OTP with rate limiting
   */
  verifyOTP: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const limiter = rateLimiters.otp();

      // Rate limit verification attempts
      const result = await limiter.consume(`otp:verify:${input.email}`);
      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many verification attempts. Request a new OTP in ${formatRateLimitError(result.resetMs)}`,
        });
      }

      // Verify OTP
      const isValid = await verifyOTPCode(input.email, input.code);

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid OTP. ${result.remaining} attempts remaining`,
        });
      }

      // Success - reset limit
      await limiter.reset(`otp:verify:${input.email}`);

      return { success: true };
    }),

  /**
   * Password reset request with rate limiting
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const limiter = rateLimiters.passwordReset();
      const ip = getClientIp(ctx.req);

      // Rate limit by email
      const emailResult = await limiter.consume(`password-reset:${input.email}`);
      if (!emailResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many password reset requests. ${formatRateLimitError(emailResult.resetMs)}`,
        });
      }

      // Rate limit by IP
      const ipResult = await limiter.consume(`password-reset:ip:${ip}`);
      if (!ipResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many password reset requests from your IP. ${formatRateLimitError(ipResult.resetMs)}`,
        });
      }

      // Send password reset email
      await sendPasswordResetEmail(input.email);

      return { success: true };
    }),

  /**
   * Resend verification email with rate limiting
   */
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const verificationLimiter = createRateLimiter({
        points: 5,
        duration: 3600, // 5 emails per hour
        strategy: "sliding-window",
      });

      const emailLimiter = rateLimiters.email();

      const result = await verificationLimiter.consume(`email-verification:${input.email}`);
      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many verification emails. ${formatRateLimitError(result.resetMs)}`,
        });
      }

      const emailResult = await emailLimiter.consume(`email:verification:${input.email}`);
      if (!emailResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Email rate limit exceeded",
        });
      }

      await sendVerificationEmail(input.email);

      return {
        success: true,
        attemptsRemaining: result.remaining,
      };
    }),
});

/**
 * Example 2: API Router with Rate Limiting
 */
export const dataRouter = createTRPCRouter({
  /**
   * Get all data with rate limiting
   */
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limiter = rateLimiters.api();

      // Rate limit by user ID
      const result = await limiter.consume(`api:user:${ctx.user.id}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `API rate limit exceeded. ${formatRateLimitError(result.resetMs)}`,
        });
      }

      // Fetch data
      const data = await fetchData(input);

      return {
        data,
        rateLimit: {
          limit: result.limit,
          remaining: result.remaining,
          resetAt: result.resetAt,
        },
      };
    }),

  /**
   * Create data with higher rate limit cost
   */
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const limiter = rateLimiters.api();

      // Write operations cost more points
      const result = await limiter.consume(`api:user:${ctx.user.id}`, 5);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Insufficient rate limit. This operation requires 5 points, only ${result.remaining} remaining.`,
        });
      }

      const data = await createData(input);

      return { data, remaining: result.remaining };
    }),
});

/**
 * Example 3: Export Router with Strict Rate Limiting
 */
export const exportRouter = createTRPCRouter({
  /**
   * Export data with strict rate limiting
   */
  exportData: protectedProcedure
    .input(z.object({ format: z.enum(["csv", "excel", "pdf"]) }))
    .mutation(async ({ ctx, input }) => {
      // Very strict rate limiting for exports
      const limiter = createRateLimiter({
        points: 5,
        duration: 3600, // 5 exports per hour
        strategy: "sliding-window",
      });

      const result = await limiter.consume(`export:user:${ctx.user.id}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Export limit reached. ${formatRateLimitError(result.resetMs)}`,
        });
      }

      // Generate export
      const exportUrl = await generateExport(ctx.user.id, input.format);

      return {
        url: exportUrl,
        remaining: result.remaining,
        resetAt: result.resetAt,
      };
    }),
});

/**
 * Example 4: Public API with IP-based Rate Limiting
 */
export const publicApiRouter = createTRPCRouter({
  /**
   * Search endpoint with IP-based rate limiting
   */
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx }) => {
      const limiter = rateLimiters.moderate();
      const ip = getClientIp(ctx.req);

      // Rate limit by IP for public endpoints
      const result = await limiter.consume(`search:ip:${ip}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded",
        });
      }

      const results = await performSearch(input.query);

      return { results, remaining: result.remaining };
    }),
});

/**
 * Example 5: Tiered Rate Limiting based on User Role
 */
export const tieredApiRouter = createTRPCRouter({
  getData: protectedProcedure.query(async ({ ctx }) => {
    // Get rate limiter based on user tier
    const limiterConfig = {
      free: { points: 100, duration: 3600 },
      premium: { points: 1000, duration: 3600 },
      enterprise: { points: 10000, duration: 3600 },
    }[ctx.user.tier] || { points: 100, duration: 3600 };

    const limiter = createRateLimiter({
      ...limiterConfig,
      strategy: "sliding-window",
    });

    const result = await limiter.consume(`api:${ctx.user.tier}:${ctx.user.id}`);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded for ${ctx.user.tier} tier`,
      });
    }

    const data = await fetchData();

    return { data, rateLimit: result };
  }),
});

/**
 * Placeholder functions (implement these in your actual code)
 */
declare function authenticateUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; token?: string }>;
declare function createUser(input: any): Promise<{ id: string }>;
declare function generateAndSendOTP(email: string): Promise<string>;
declare function verifyOTPCode(email: string, code: string): Promise<boolean>;
declare function sendPasswordResetEmail(email: string): Promise<void>;
declare function sendVerificationEmail(email: string): Promise<void>;
declare function fetchData(input?: any): Promise<any[]>;
declare function createData(input: any): Promise<any>;
declare function generateExport(userId: string, format: string): Promise<string>;
declare function performSearch(query: string): Promise<any[]>;
