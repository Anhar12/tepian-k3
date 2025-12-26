import userSchema from "@tepian-k3/schema/users.schema";
import { createTRPCRouter, protectedProcedure, withPermission } from "..";
import { Effect } from "effect";
import { storageService } from "@tepian-k3/services/storage";
import usersQueries from "@tepian-k3/queries/users.queries";
import z from "zod";

export const userRouter = createTRPCRouter({
  getUserPaginated: withPermission("users.read")
    .input(userSchema.getAllUsersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        usersQueries.getOffsetPaginatedUsers(input)
      );

      return { data, pageCount };
    }),

  getUserDetails: withPermission("users.read")
    .input(
      z.object({
        userId: z.uuidv7(),
      })
    )
    .query(
      async ({ ctx: { user } }) =>
        await Effect.runPromise(usersQueries.getUserById(user.id))
    ),

  createUser: withPermission("users.create")
    .input(userSchema.adminCreateUserSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(usersQueries.adminCreateUser(input))
    ),

  updateUser: withPermission("users.update")
    .input(userSchema.adminUpdateUserSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(usersQueries.updateUser(input, input.id))
    ),

  updateProfile: protectedProcedure
    .input(userSchema.updateUserSchema)
    .mutation(async ({ input, ctx: { user } }) =>
      Effect.runPromise(usersQueries.updateUserProfile(user.id, input))
    ),

  updateAvatar: protectedProcedure
    .input(userSchema.updateUserProfileSchema)
    .mutation(async ({ input, ctx: { user } }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          // Convert file to buffer
          const arrayBuffer = yield* Effect.tryPromise(() =>
            input.avatar.arrayBuffer()
          );
          const buffer = Buffer.from(arrayBuffer);

          const uploadedFile = yield* storageService.upload(buffer, {
            filename: input.avatar.name,
            folder: "avatars",
          });

          yield* usersQueries.updateUserAvatar(
            user.id,
            uploadedFile.filename,
            uploadedFile.key
          );
        })
      )
    ),
  updatePassword: protectedProcedure
    .input(userSchema.updateUserPasswordSchema)
    .mutation(async ({ input, ctx: { user } }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          yield* usersQueries.updateUserPassword(user.id, input.newPassword);
        })
      )
    ),
});
