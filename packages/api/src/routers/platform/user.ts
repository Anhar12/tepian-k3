import userSchema from "@tepian-k3/schema/platform/users.schema";
import {
  createTRPCRouter,
  withPermission,
  withProtectedRateLimit,
} from "../..";
import { storageService, FILE_SIZE_LIMITS } from "@tepian-k3/services/storage";
import usersQueries from "@tepian-k3/queries/platform/users.queries";
import z from "zod";
import permissionQueries from "@tepian-k3/queries/platform/permission.queries";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../../utils/run-effect";
import { Effect } from "effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { processAndUploadImage } from "../../utils/image-upload";

export const userRouter = createTRPCRouter({
  getAllUsers: withPermission("users.view").query(
    async () => await runEffect(usersQueries.getAllUsers()),
  ),

  getUserPaginated: withPermission("users.read")
    .input(userSchema.getAllUsersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        usersQueries.getOffsetPaginatedUsers(input),
      );

      return { data, pageCount };
    }),

  getDeletedUserPaginated: withPermission("users.read")
    .input(userSchema.getAllUsersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        usersQueries.getOffsetPaginatedDeletedUsers(input),
      );
      return { data, pageCount };
    }),

  getUserDetails: withPermission("users.read")
    .input(
      z.object({
        userId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(usersQueries.getUserById(input.userId)),
    ),

  getUserDetailWithRolesAndPermissions: withPermission("users.read")
    .input(
      z.object({
        userId: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const user = await runEffect(
        permissionQueries.getUserWithPermissions(input.userId),
      );

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pengguna tidak ditemukan",
        });
      }

      return {
        ...user,
        profilePictureUrl: user.profilePictureUrl
          ? storageService.getPublicUrl(user.profilePictureUrl)
          : null,
      };
    }),

  createUser: withPermission("users.create")
    .input(userSchema.adminCreateUserSchema)
    .mutation(
      async ({ input }) => await runEffect(usersQueries.adminCreateUser(input)),
    ),

  updateUser: withPermission("users.update")
    .input(userSchema.adminUpdateUserSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(usersQueries.updateUser(input, input.id)),
    ),

  updateProfile: withProtectedRateLimit(rateLimiters.moderate())
    .input(userSchema.updateUserSchema)
    .mutation(async ({ input, ctx: { user } }) =>
      runEffect(usersQueries.updateUserProfile(user.id, input)),
    ),

  updateAvatar: withProtectedRateLimit(rateLimiters.moderate())
    .input(userSchema.updateUserProfileSchema)
    .mutation(async ({ input, ctx: { user } }) =>
      runEffect(
        Effect.gen(function* () {
          const uploaded = yield* processAndUploadImage(input.avatar, {
            folder: "avatars",
            maxSize: FILE_SIZE_LIMITS.AVATAR,
          });

          yield* usersQueries.updateUserAvatar(user.id, uploaded.key);
        }),
      ),
    ),

  updatePassword: withProtectedRateLimit(rateLimiters.moderate())
    .input(userSchema.updateUserPasswordSchema)
    .mutation(async ({ input, ctx: { user } }) =>
      runEffect(
        Effect.gen(function* () {
          yield* usersQueries.updateUserPassword(user.id, input.newPassword);
        }),
      ),
    ),

  deleteUser: withPermission("users.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) => await runEffect(usersQueries.deleteUser(input.id)),
    ),

  restoreUser: withPermission("users.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) => await runEffect(usersQueries.restoreUser(input.id)),
    ),

  hardDeleteUser: withPermission("users.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(usersQueries.hardDeleteUser(input.id)),
    ),
});
