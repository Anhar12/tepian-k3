import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
} from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import {
  permission,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "@tepian-k3/db/schema";
import { logError } from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import type z from "zod";
import rolesSchema from "@tepian-k3/schema/platform/role.schema";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import type { Permission } from "@tepian-k3/types/platform/permission.types";

const rolesQueries = {
  getAllRoles() {
    return Effect.tryPromise({
      try: () => db.query.roles.findMany(),
      catch: (error) => {
        logError("rolesQueries.getAllRoles", "Failed to get all roles", {
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data peran.",
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
        logError(
          "rolesQueries.getRoleById",
          `Error fetching role with ID ${roleId}:`,
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data peran.",
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
                message: `Peran dengan ID ${roleId} tidak ditemukan.`,
              }),
            ),
      ),
    );
  },

  getRoleWithPermissionsById(roleId: string) {
    return Effect.gen(function* () {
      const role = yield* rolesQueries.getRoleById(roleId);

      // get permission from role
      let rolePerms: Permission[] = [];
      yield* Effect.tryPromise({
        try: async () => {
          const rolePermsData = await db
            .select({
              permission: permission,
            })
            .from(rolePermissions)
            .innerJoin(
              permission,
              eq(rolePermissions.permissionId, permission.id),
            )
            .where(eq(rolePermissions.roleId, role.id));

          rolePerms = rolePermsData.map((rp) => rp.permission);
        },
        catch: (error) => {
          logError(
            "rolesQueries.getRoleWithPermissionsById",
            "Error fetching role permissions",
            { error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data izin peran",
          });
        },
      });

      const allPermissions = new Map<string, boolean>();

      rolePerms.forEach((perm) => {
        allPermissions.set(perm.name, true);
      });

      return {
        ...role,
        permissions: Array.from(allPermissions.keys()),
      };
    });
  },

  getDeletedRoleById(roleId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.roles.findFirst({
          where: and(eq(roles.id, roleId), isNotNull(roles.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "rolesQueries.getDeletedRoleById",
          `Error fetching deleted role with ID ${roleId}:`,
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data peran yang dihapus.",
          cause: error,
        });
      },
    });
  },

  getRoleByName(roleName: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.roles.findFirst({
          where: eq(roles.name, roleName),
        }),
      catch: (error) => {
        logError(
          "rolesQueries.getRoleByName",
          `Error fetching role with name ${roleName}:`,
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch role.",
          cause: error,
        });
      },
    }).pipe(
      Effect.flatMap((role) =>
        role ? Effect.succeed(role) : Effect.succeed(null),
      ),
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
          logError("rolesQueries.getUsersByRole", "Error fetching role", {
            error,
          });
          throw new TRPCError({
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
          logError(
            "rolesQueries.getUsersByRole",
            "Error fetching users by role",
            {
              error,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data user berdasarkan peran",
          });
        },
      });

      return userRolesData.map((ur) => ur.user);
    });
  },

  getOffsetPaginatedRoles(
    input: z.infer<typeof rolesSchema.getAllRolesSchema>,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: roles,
            filters: input.filters as ExtendedColumnFilter<typeof roles>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(roles.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        roles.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        roles.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                )
              : undefined,
            input.showDeleted
              ? isNotNull(roles.deletedAt)
              : isNull(roles.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(roles[item.id]) : asc(roles[item.id]),
            )
          : [desc(roles.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(roles)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(roles)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "rolesQueries.getOffsetPaginatedRoles",
            "Error fetching paginated roles",
            {
              error,
              input,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data roles`,
            cause: error,
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return {
        data,
        pageCount,
      };
    });
  },

  // createRole(data: z.infer<typeof rolesSchema.createRoleSchema>) {
  //   return Effect.gen(function* () {
  //     const isExistingRole = yield* rolesQueries.getRoleByName(data.name);
  //
  //     if (isExistingRole) {
  //       return yield* Effect.fail(
  //         new TRPCError({
  //           code: "CONFLICT",
  //           message: `Peran dengan nama ${data.name} sudah ada.`,
  //         }),
  //       );
  //     }
  //
  //     const [newRole] = yield* Effect.tryPromise({
  //       try: () => db.insert(roles).values(data).returning(),
  //       catch: (error) => {
  //         logError("rolesQueries.createRole", "Error creating role", { error });
  //         throw new TRPCError({
  //           code: "INTERNAL_SERVER_ERROR",
  //           message: "Gagal membuat peran.",
  //           cause: error,
  //         });
  //       },
  //     });
  //
  //     if (!newRole) {
  //       return yield* Effect.fail(
  //         new TRPCError({
  //           code: "INTERNAL_SERVER_ERROR",
  //           message: "Gagal membuat peran.",
  //         }),
  //       );
  //     }
  //
  //     return newRole;
  //   });
  // },

  updateRole(data: z.infer<typeof rolesSchema.updateRoleSchema>) {
    return Effect.gen(function* () {
      const existingRole = yield* rolesQueries.getRoleById(data.id);

      if (!existingRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Peran dengan ID ${data.id} tidak ditemukan.`,
          }),
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
          logError("rolesQueries.updateRole", "Error updating role", { error });
          throw new TRPCError({
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
          }),
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
          }),
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
          logError("rolesQueries.deleteRole", "Error deleting role", { error });
          throw new TRPCError({
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
          }),
        );
      }

      return deletedRole;
    });
  },

  restoreRole(roleId: string) {
    return Effect.gen(function* () {
      const existingRole = yield* rolesQueries.getDeletedRoleById(roleId);

      if (!existingRole) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Peran dengan ID ${roleId} tidak ditemukan.`,
          }),
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
          logError("rolesQueries.restoreRole", "Error restoring role", {
            error,
          });
          throw new TRPCError({
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
          }),
        );
      }

      return restoredRole;
    });
  },
};

export default rolesQueries;
