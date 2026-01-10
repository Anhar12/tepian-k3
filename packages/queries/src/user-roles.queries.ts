import { and, eq } from "@tepian-k3/db";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { roles, userRoles } from "@tepian-k3/db/schema";
import { logError } from "@tepian-k3/services/logger";
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
          logError(
            "userRolesQueries.assingDefaultRoleToUser",
            "Error fetching default role",
            { error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil peran default.",
            cause: error,
          });
        },
      });

      if (!defaultRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Peran default tidak ditemukan.",
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
        logError(
          "userRolesQueries.assignRoleToUser",
          `Error assigning role ${roleId} to user ${userId}:`,
          { error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menetapkan peran ke user.",
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
        logError(
          "userRolesQueries.assignRole",
          "Error assigning role to user",
          { error }
        );
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
        logError(
          "userRolesQueries.assignRoles",
          "Error assigning roles to user",
          { error }
        );
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
        logError(
          "userRolesQueries.removeRole",
          "Error removing role from user",
          { error }
        );
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
        logError(
          "userRolesQueries.removeAllRoles",
          "Error removing all roles from user",
          { error }
        );
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
        logError(
          "userRolesQueries.replaceRoles",
          "Error replacing roles for user",
          { error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengganti peran user",
        });
      },
    });
  },
};

export default userRolesQueries;
