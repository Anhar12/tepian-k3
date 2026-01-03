import { and, eq } from "@tepian-k3/db";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { roles, userRoles } from "@tepian-k3/db/schema";
import logger from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

const userRolesQueries = {
  assingDefaultRoleToUser(userId: string, tx: DBorTx = db) {
    return Effect.gen(function* () {
      const defaultRole = yield* Effect.tryPromise({
        try: () =>
          tx.query.roles.findFirst({
            where: eq(roles.name, "user"),
          }),
        catch: (error) => {
          logger.error("Error fetching default role", { error });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch default role.",
            cause: error,
          });
        },
      });

      if (!defaultRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Default role not found.",
          })
        );
      }

      return yield* userRolesQueries.assignRoleToUser(
        userId,
        defaultRole.id,
        tx
      );
    });
  },

  assignRoleToUser(userId: string, roleId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () => tx.insert(userRoles).values({ userId, roleId }).returning(),
      catch: (error) => {
        logger.error(
          `Error assigning role ${roleId} to user ${userId}:`,
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign role to user.",
          cause: error,
        });
      },
    });
  },

  // Assign role to user
  assignRole(userId: string, roleId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () =>
        tx
          .insert(userRoles)
          .values({
            userId,
            roleId,
          })
          .onConflictDoNothing()
          .returning(),
      catch: (error) => {
        logger.error("Error assigning role to user", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menetapkan peran ke user",
        });
      },
    });
  },

  // Assign multiple rols to user
  assignRoles(userId: string, roleIds: string[], tx: DBorTx = db) {
    if (roleIds.length === 0) return;

    return Effect.tryPromise({
      try: () =>
        tx
          .insert(userRoles)
          .values(
            roleIds.map((roleId) => ({
              userId,
              roleId,
            }))
          )
          .onConflictDoNothing()
          .returning(),
      catch: (error) => {
        logger.error("Error assigning roles to user", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menetapkan peran ke user",
        });
      },
    });
  },

  // Remove role from user
  removeRole(userId: string, roleId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () =>
        tx
          .delete(userRoles)
          .where(
            and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))
          )
          .returning(),
      catch: (error) => {
        logger.error("Error removing role from user", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus peran dari user",
        });
      },
    });
  },

  // Remove all roles from user
  removeAllRoles(userId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () =>
        tx.delete(userRoles).where(eq(userRoles.userId, userId)).returning(),
      catch: (error) => {
        logger.error("Error removing all roles from user", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus semua peran dari user",
        });
      },
    });
  },

  // Replace user's roles (remove old, add new)
  replaceRoles(userId: string, roleIds: string[]) {
    return Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          // remove all existing roles
          await tx.delete(userRoles).where(eq(userRoles.userId, userId));

          // assign new roles
          if (roleIds.length > 0) {
            await tx.insert(userRoles).values(
              roleIds.map((roleId) => ({
                userId,
                roleId,
              }))
            );
          }
        }),
      catch: (error) => {
        logger.error("Error replacing roles for user", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengganti peran user",
        });
      },
    });
  },
};

export default userRolesQueries;
