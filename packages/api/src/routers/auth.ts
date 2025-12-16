import authSchema from "@tepian-k3/schema/auth.schema";
import { createTRPCRouter, publicProcedure } from "..";
import usersQueries from "@tepian-k3/queries/users.queries";
import { TRPCError } from "@trpc/server";
import { verify } from "@node-rs/argon2";
import { encrypt } from "@tepian-k3/auth";
import userSchema from "@tepian-k3/schema/users.schema";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(authSchema.loginSchema)
    .mutation(async ({ input }) => {
      const user = await usersQueries.getUserByUsername(input.username);

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

      // Generate JWT token
      const token = await encrypt({
        id: user.id,
        username: user.username,
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

  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),
});
