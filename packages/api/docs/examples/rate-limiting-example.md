# Rate Limiting Example: Auth Router

This example shows how to add rate limiting to an existing authentication router.

## Before: Without Rate Limiting

```typescript
// packages/api/src/routers/auth.ts
import authSchema from "@tepian-k3/schema/platform/auth.schema";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "..";

export const authRouter = createTRPCRouter({
  // ❌ No rate limiting - vulnerable to brute force attacks
  login: publicProcedure
    .input(authSchema.loginSchema)
    .mutation(async ({ input, ctx }) => {
      // Login logic
      return await handleLogin(input);
    }),

  // ❌ No rate limiting - can be spammed
  register: publicProcedure
    .input(authSchema.registerSchema)
    .mutation(async ({ input }) => {
      return await handleRegistration(input);
    }),

  // ❌ No rate limiting - OTP can be spammed
  sendOtp: publicProcedure
    .input(otpSchema.sendOtpSchema)
    .mutation(async ({ input }) => {
      return await sendOtpEmail(input.email);
    }),
});
```

## After: With Rate Limiting

```typescript
// packages/api/src/routers/auth.ts
import authSchema from "@tepian-k3/schema/platform/auth.schema";
import { createTRPCRouter, withRateLimit, publicProcedure } from "..";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

export const authRouter = createTRPCRouter({
  // ✅ Rate limited by email - 5 attempts per 15 minutes
  login: withRateLimit(
    rateLimiters.auth(),
    (ctx, input) => `login:${input.email}`,
  )
    .input(authSchema.loginSchema)
    .mutation(async ({ input, ctx }) => {
      // Login logic
      return await handleLogin(input);
    }),

  // ✅ Rate limited by IP - 5 registrations per 15 minutes
  register: withRateLimit(rateLimiters.auth())
    .input(authSchema.registerSchema)
    .mutation(async ({ input }) => {
      return await handleRegistration(input);
    }),

  // ✅ Rate limited by email - 3 attempts per 5 minutes
  sendOtp: withRateLimit(
    rateLimiters.otp(),
    (ctx, input) => `otp:${input.email}`,
  )
    .input(otpSchema.sendOtpSchema)
    .mutation(async ({ input }) => {
      return await sendOtpEmail(input.email);
    }),

  // ✅ Rate limited by email - 3 attempts per 5 minutes
  verifyOtp: withRateLimit(
    rateLimiters.otp(),
    (ctx, input) => `verify:${input.email}`,
  )
    .input(otpSchema.verifyOtpSchema)
    .mutation(async ({ input }) => {
      return await verifyOtpCode(input);
    }),

  // ✅ Rate limited by email - 3 attempts per hour
  forgotPassword: withRateLimit(
    rateLimiters.passwordReset(),
    (ctx, input) => `reset:${input.email}`,
  )
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      return await sendPasswordResetEmail(input.email);
    }),
});
```

## Step-by-Step Migration

### Step 1: Import Dependencies

```typescript
// At the top of your router file
import { withRateLimit, withProtectedRateLimit } from "..";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
```

### Step 2: Choose the Right Limiter

For authentication endpoints, use these presets:

- `rateLimiters.auth()` - For login, register (5 per 15 min)
- `rateLimiters.otp()` - For OTP operations (3 per 5 min)
- `rateLimiters.passwordReset()` - For password reset (3 per hour)

### Step 3: Wrap Your Procedure

Replace `publicProcedure` or `protectedProcedure` with the rate limiting wrapper:

```typescript
// Before
login: publicProcedure.input(schema).mutation(async ({ input }) => { ... })

// After
login: withRateLimit(rateLimiters.auth(), (ctx, input) => `login:${input.email}`)
  .input(schema)
  .mutation(async ({ input }) => { ... })
```

### Step 4: Define the Rate Limit Key

The key determines what is being rate limited:

```typescript
// By email (recommended for login)
(ctx, input) => `login:${input.email}`

// By IP (good for registration)
// No second parameter needed - uses IP by default
rateLimiters.auth()

// By email + IP combination
(ctx, input) => `action:${input.email}:${ctx.ip}`

// By user ID (for protected endpoints)
(ctx) => `action:${ctx.user.id}`
```

## Real-World Example: Complete Auth Router

```typescript
import authSchema from "@tepian-k3/schema/platform/auth.schema";
import {
  createTRPCRouter,
  withRateLimit,
  withProtectedRateLimit,
  publicProcedure,
} from "..";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import usersQueries from "@tepian-k3/queries/users.queries";
import { TRPCError } from "@trpc/server";
import { verify } from "@node-rs/argon2";
import { createAccessToken, createRefreshToken } from "@tepian-k3/auth";
import { OTPService } from "@tepian-k3/auth/services/otp";
import { PasswordResetService } from "@tepian-k3/auth/services/password-reset";
import { Effect } from "effect";
import { runEffect } from "../utils/run-effect";
import z from "zod";

export const authRouter = createTRPCRouter({
  /**
   * Login endpoint
   * Rate limited by email to prevent brute force attacks
   */
  login: withRateLimit(
    rateLimiters.auth(),
    (ctx, input) => `login:${input.email}`,
  )
    .input(authSchema.loginSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const user = yield* usersQueries.getUserByEmail(input.email);

            const verifyPasswordResult = yield* Effect.tryPromise({
              try: () => verify(user.password, input.password),
              catch: (error) => {
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Gagal memverifikasi password.",
                  cause: error,
                });
              },
            });

            if (!verifyPasswordResult) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "Username atau password salah.",
                }),
              );
            }

            if (!user.emailVerified) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "FORBIDDEN",
                  message: "Email belum terverifikasi.",
                }),
              );
            }

            // Create tokens
            const accessToken = yield* Effect.tryPromise(() =>
              createAccessToken({
                id: user.id,
                email: user.email,
                roles: [],
                permissions: [],
              }),
            );

            return {
              accessToken,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
            };
          }),
        ),
    ),

  /**
   * Registration endpoint
   * Rate limited by IP address (5 registrations per 15 minutes)
   */
  register: withRateLimit(rateLimiters.auth())
    .input(authSchema.registerSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            // Check if user exists
            const existingUser = yield* Effect.tryPromise(() =>
              usersQueries.getUserByEmail(input.email).catch(() => null),
            );

            if (existingUser) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "CONFLICT",
                  message: "Email sudah terdaftar.",
                }),
              );
            }

            // Create user
            const user = yield* usersQueries.createUser(input);

            // Send OTP
            yield* Effect.tryPromise(() => OTPService.sendOTP(user.email));

            return {
              id: user.id,
              email: user.email,
              message:
                "Registrasi berhasil. Silakan cek email untuk verifikasi.",
            };
          }),
        ),
    ),

  /**
   * Send OTP endpoint
   * Rate limited by email (3 attempts per 5 minutes)
   */
  sendOtp: withRateLimit(
    rateLimiters.otp(),
    (ctx, input) => `otp:${input.email}`,
  )
    .input(z.object({ email: z.string().email() }))
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const user = yield* usersQueries.getUserByEmail(input.email);

            if (user.emailVerified) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Email sudah terverifikasi.",
                }),
              );
            }

            yield* Effect.tryPromise(() => OTPService.sendOTP(user.email));

            return {
              message: "Kode OTP telah dikirim ke email Anda.",
            };
          }),
        ),
    ),

  /**
   * Verify OTP endpoint
   * Rate limited by email (3 attempts per 5 minutes)
   */
  verifyOtp: withRateLimit(
    rateLimiters.otp(),
    (ctx, input) => `verify:${input.email}`,
  )
    .input(z.object({ email: z.string().email(), code: z.string() }))
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const isValid = yield* Effect.tryPromise(() =>
              OTPService.verifyOTP(input.email, input.code),
            );

            if (!isValid) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Kode OTP salah atau sudah kadaluarsa.",
                }),
              );
            }

            // Mark email as verified
            yield* usersQueries.markEmailAsVerified(input.email);

            return {
              message: "Email berhasil diverifikasi.",
            };
          }),
        ),
    ),

  /**
   * Forgot password endpoint
   * Rate limited by email (3 attempts per hour)
   */
  forgotPassword: withRateLimit(
    rateLimiters.passwordReset(),
    (ctx, input) => `reset:${input.email}`,
  )
    .input(z.object({ email: z.string().email() }))
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const user = yield* usersQueries.getUserByEmail(input.email);

            yield* Effect.tryPromise(() =>
              PasswordResetService.sendResetEmail(user.email),
            );

            return {
              message: "Link reset password telah dikirim ke email Anda.",
            };
          }),
        ),
    ),

  /**
   * Reset password endpoint
   * Rate limited by token (prevents token reuse attacks)
   */
  resetPassword: withRateLimit(
    rateLimiters.auth(),
    (ctx, input) => `reset-pwd:${input.token}`,
  )
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const isValid = yield* Effect.tryPromise(() =>
              PasswordResetService.verifyToken(input.token),
            );

            if (!isValid) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "BAD_REQUEST",
                  message:
                    "Token reset password tidak valid atau sudah kadaluarsa.",
                }),
              );
            }

            yield* Effect.tryPromise(() =>
              PasswordResetService.resetPassword(input.token, input.password),
            );

            return {
              message: "Password berhasil direset.",
            };
          }),
        ),
    ),

  /**
   * Logout endpoint
   * Rate limited by user ID (prevents logout spam)
   */
  logout: withProtectedRateLimit(rateLimiters.api()).mutation(
    async ({ ctx }) => {
      // Logout logic (invalidate session, etc.)
      return {
        message: "Berhasil logout.",
      };
    },
  ),

  /**
   * Refresh token endpoint
   * No rate limiting needed - tokens already have built-in expiry
   */
  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      // Refresh token logic
      return {
        accessToken: "new-access-token",
      };
    }),
});
```

## Testing Rate Limits

### Test 1: Login Rate Limit

```typescript
// In your test file
describe("Auth Rate Limiting", () => {
  it("should block after 5 failed login attempts", async () => {
    const email = "test@example.com";

    // First 5 attempts should succeed (but fail auth)
    for (let i = 0; i < 5; i++) {
      try {
        await trpc.auth.login.mutate({
          email,
          password: "wrong-password",
        });
      } catch (error) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    }

    // 6th attempt should be rate limited
    try {
      await trpc.auth.login.mutate({
        email,
        password: "wrong-password",
      });
    } catch (error) {
      expect(error.code).toBe("TOO_MANY_REQUESTS");
      expect(error.message).toContain("Terlalu banyak permintaan");
    }
  });
});
```

### Test 2: OTP Rate Limit

```typescript
it("should block after 3 OTP send attempts", async () => {
  const email = "test@example.com";

  // First 3 attempts should succeed
  for (let i = 0; i < 3; i++) {
    await trpc.auth.sendOtp.mutate({ email });
  }

  // 4th attempt should be rate limited
  try {
    await trpc.auth.sendOtp.mutate({ email });
  } catch (error) {
    expect(error.code).toBe("TOO_MANY_REQUESTS");
  }
});
```

## Client-Side Error Handling

### React Example

```typescript
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

function LoginForm() {
  const loginMutation = trpc.auth.login.useMutation({
    onError: (error) => {
      if (error.data?.code === "TOO_MANY_REQUESTS") {
        toast.error(error.message);
        // Optionally disable the form for the duration
      } else {
        toast.error("Login failed");
      }
    },
    onSuccess: () => {
      toast.success("Login successful");
    },
  });

  const handleSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={loginMutation.isLoading || loginMutation.error?.data?.code === "TOO_MANY_REQUESTS"}
      >
        Login
      </button>
      {loginMutation.error?.data?.code === "TOO_MANY_REQUESTS" && (
        <p className="text-red-500">
          Too many attempts. Please try again later.
        </p>
      )}
    </form>
  );
}
```

## Summary

1. Import `withRateLimit` and `rateLimiters` from the appropriate packages
2. Replace `publicProcedure` with `withRateLimit(limiter, getKey?)`
3. Choose appropriate preset: `auth()`, `otp()`, `passwordReset()`, `api()`
4. Define rate limit key based on what you want to limit (email, IP, user ID)
5. Handle `TOO_MANY_REQUESTS` errors on the client side
6. Test your rate limits to ensure they work as expected

For more details, see the [Rate Limiting Middleware Guide](../RATE_LIMITING_MIDDLEWARE.md).
