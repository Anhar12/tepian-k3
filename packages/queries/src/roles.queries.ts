import { and, eq, isNull } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { roles, userRoles, users } from "@tepian-k3/db/schema";
import logger from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import type z from "zod";
import rolesSchema from "@tepian-k3/schema/role.schema";

const rolesQueries = {
  getAllRoles() {
    return Effect.tryPromise({
      try: () => db.query.roles.findMany(),
      catch: (error) => {
        logger.error("Error fetching roles:", error);
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch roles.",
          cause: error,
        });
      },
    });
  },

  getRoleById(roleId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.roles.findFirst({
          where: eq(roles.id, roleId),
        }),
      catch: (error) => {
        logger.error(`Error fetching role with ID ${roleId}:`, error);
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch role.",
          cause: error,
        });
      },
    }).pipe(
      Effect.flatMap((role) =>
        role
          ? Effect.succeed(role)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: `Role with ID ${roleId} not found.`,
              })
            )
      )
    );
  },

  getRoleByName(roleName: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.roles.findFirst({
          where: eq(roles.name, roleName),
        }),
      catch: (error) => {
        logger.error(`Error fetching role with name ${roleName}:`, error);
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch role.",
          cause: error,
        });
      },
    }).pipe(
      Effect.flatMap((role) =>
        role ? Effect.succeed(role) : Effect.succeed(null)
      )
    );
  },

  // Get all users with a specific role
  getUsersByRole(roleName: string) {
    return Effect.gen(function* () {
      const role = yield* Effect.tryPromise({
        try: () =>
          db.query.roles.findFirst({
            where: eq(roles.name, roleName),
          }),
        catch: (error) => {
          logger.error("Error fetching role", { error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data peran",
          });
        },
      });

      if (!role) return [];

      const userRolesData = yield* Effect.tryPromise({
        try: () =>
          db
            .select({
              user: users,
            })
            .from(userRoles)
            .innerJoin(users, eq(userRoles.userId, users.id))
            .where(and(eq(userRoles.roleId, role.id), isNull(users.deletedAt))),
        catch: (error) => {
          logger.error("Error fetching users by role", { error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data user berdasarkan peran",
          });
        },
      });

      return userRolesData.map((ur) => ur.user);
    });
  },

  createRole(data: z.infer<typeof rolesSchema.createRoleSchema>) {
    return Effect.gen(function* () {
      const isExistingRole = yield* rolesQueries.getRoleByName(data.name);

      if (isExistingRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message: `Peran dengan nama ${data.name} sudah ada.`,
          })
        );
      }

      const [newRole] = yield* Effect.tryPromise({
        try: () => db.insert(roles).values(data).returning(),
        catch: (error) => {
          logger.error("Error creating role:", error);
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat peran.",
            cause: error,
          });
        },
      });

      if (!newRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat peran.",
          })
        );
      }

      return newRole;
    });
  },

  updateRole(data: z.infer<typeof rolesSchema.updateRoleSchema>) {
    return Effect.gen(function* () {
      const existingRole = yield* rolesQueries.getRoleById(data.id);

      if (!existingRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Peran dengan ID ${data.id} tidak ditemukan.`,
          })
        );
      }

      const [updatedRole] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(roles)
            .set({
              name: data.name,
              description: data.description,
            })
            .where(eq(roles.id, data.id))
            .returning(),
        catch: (error) => {
          logger.error("Error updating role:", error);
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui peran.",
            cause: error,
          });
        },
      });

      if (!updatedRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui peran.",
          })
        );
      }

      return updatedRole;
    });
  },

  deleteRole(roleId: string) {
    return Effect.gen(function* () {
      const existingRole = yield* rolesQueries.getRoleById(roleId);

      if (!existingRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Peran dengan ID ${roleId} tidak ditemukan.`,
          })
        );
      }

      const [deletedRole] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(roles)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(roles.id, roleId))
            .returning(),
        catch: (error) => {
          logger.error("Error deleting role:", error);
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus peran.",
            cause: error,
          });
        },
      });

      if (!deletedRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus peran.",
          })
        );
      }

      return deletedRole;
    });
  },

  restoreRole(roleId: string) {
    return Effect.gen(function* () {
      const existingRole = yield* rolesQueries.getRoleById(roleId);

      if (!existingRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Peran dengan ID ${roleId} tidak ditemukan.`,
          })
        );
      }

      const [restoredRole] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(roles)
            .set({ deletedAt: null })
            .where(eq(roles.id, roleId))
            .returning(),
        catch: (error) => {
          logger.error("Error restoring role:", error);
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan peran.",
            cause: error,
          });
        },
      });

      if (!restoredRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan peran.",
          })
        );
      }

      return restoredRole;
    });
  },
};

export default rolesQueries;
