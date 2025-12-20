import authSchema from "@tepian-k3/schema/auth.schema";
import { createTRPCRouter, publicProcedure } from "..";
import usersQueries from "@tepian-k3/queries/users.queries";
import { TRPCError } from "@trpc/server";
import { verify } from "@node-rs/argon2";
import { encrypt } from "@tepian-k3/auth";
import userSchema from "@tepian-k3/schema/users.schema";
import otpSchema from "@tepian-k3/schema/otp.schema";
import { OTPService } from "@tepian-k3/auth/services/otp";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(authSchema.loginSchema)
    .mutation(async ({ input }) => {
      const user = await usersQueries.getUserByEmail(input.email);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Username atau password salah.",
        });
      }

      const verifyPasswordResult = await verify(user.password, input.password);

      if (!verifyPasswordResult) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Username atau password salah.",
        });
      }

      if (!user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Email belum terverifikasi.",
        });
      }

      // Generate JWT token
      const token = await encrypt({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
        iat: Math.floor(Date.now() / 1000),
        jti: user.id,
      });

      return {
        token,
        user: {
          ...user,
          password: undefined,
        },
      };
    }),
  register: publicProcedure
    .input(userSchema.createUserSchema)
    .mutation(async ({ input }) => {
      const createdUser = await usersQueries.createUser(input);

      return createdUser;
    }),

  sendOTP: publicProcedure
    .input(otpSchema.createOtpSchema)
    .mutation(async ({ input }) => {
      const result = await OTPService.createOTP(input);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  resendOTP: publicProcedure
    .input(otpSchema.createOtpSchema)
    .mutation(async ({ input }) => {
      const result = await OTPService.resendOTP(input);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  verifyOTP: publicProcedure
    .input(otpSchema.verifyOtpSchema)
    .mutation(async ({ input }) => {
      const result = await OTPService.verifyOTP(input);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    const user = await usersQueries.getUserById(ctx.user?.id);

    return user;
  }),
});
