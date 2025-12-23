import userSchema from "@tepian-k3/schema/users.schema";
import { createTRPCRouter, protectedProcedure } from "..";
import { Effect } from "effect";
import { storageService } from "@tepian-k3/services/storage";
import usersQueries from "@tepian-k3/queries/users.queries";

export const userRouter = createTRPCRouter({
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
