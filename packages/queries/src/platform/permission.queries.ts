import { and, eq, inArray } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import {
  permission,
  rolePermissions,
  roles,
  userPermissions,
  userRoles,
  users,
} from "@tepian-k3/db/schema";
import { logError } from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import type { Permission } from "@tepian-k3/types/platform/permission.types";
import rolesQueries from "./roles.queries";

const permissionQueries = {
  getAllPermissions() {
    return Effect.tryPromise({
      try: () =>
        db.query.permission.findMany({
          columns: {
            id: true,
            name: true,
          },
        }),
      catch: (error) => {
        logError(
          "permissionQueries.getAllPermissions",
          "Failed to get all permissions",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data izin",
        });
      },
    });
  },

  getUserWithPermissions(userId: string) {
    return Effect.gen(function* () {
      const user = yield* Effect.tryPromise({
        try: () =>
          db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
              password: false,
            },
          }),
        catch: (error) => {
          logError(
            "permissionQueries.getUserWithPermissions",
            "Failed to get user data",
            { userId, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data user",
          });
        },
      });

      if (!user) return null;

      // Get user roles
      const userRolesData = yield* Effect.tryPromise({
        try: () =>
          db
            .select({
              role: roles,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, user.id)),
        catch: (error) => {
          logError(
            "permissionQueries.getUserWithPermissions",
            "Failed to get user roles",
            { userId, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data peran user",
          });
        },
      });

      const userRolesList = userRolesData.map((ur) => ur.role);
      const roleIds = userRolesList.map((r) => r.id);

      // Get permissions from all roles
      let rolePerms: Permission[] = [];
      if (roleIds.length > 0) {
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
              .where(inArray(rolePermissions.roleId, roleIds));

            rolePerms = rolePermsData.map((rp) => rp.permission);
          },
          catch: (error) => {
            logError(
              "permissionQueries.getUserWithPermissions",
              "Failed to get role permissions",
              { roleIds, error },
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Gagal mengambil data izin peran",
            });
          },
        });
      }

      // Get user-specific permissions overrides
      const userPerms = yield* Effect.tryPromise({
        try: () =>
          db
            .select({
              permission: permission,
              granted: userPermissions.granted,
            })
            .from(userPermissions)
            .innerJoin(
              permission,
              eq(userPermissions.permissionId, permission.id),
            )
            .where(eq(userPermissions.userId, user.id)),

        catch: (error) => {
          logError(
            "permissionQueries.getUserWithPermissions",
            "Failed to get user permissions",
            { userId, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data izin user",
          });
        },
      });

      // Combine permissions (user overrides take precedence)
      const allPermissions = new Map<string, boolean>();

      // add role permissions
      rolePerms.forEach((perm) => {
        allPermissions.set(perm.name, true);
      });

      // Apply user overrides
      userPerms.forEach(({ permission, granted }) => {
        allPermissions.set(permission.name, granted);
      });

      // Filter only granted permissions
      const grantedPermissions = Array.from(allPermissions.entries())
        .filter(([_, granted]) => granted)
        .map(([name]) => name);

      return {
        ...user,
        roles: userRolesList,
        permissions: grantedPermissions,
      };
    });
  },

  // Check if user has specific permission
  userHasPermission(userId: string, permissionName: string) {
    return Effect.gen(function* () {
      const userWithPerms =
        yield* permissionQueries.getUserWithPermissions(userId);
      if (!userWithPerms) return false;
      return userWithPerms.permissions.includes(permissionName) || false;
    });
  },

  // Check if user has specific role
  userHasRole(userId: string, roleName: string) {
    return Effect.gen(function* () {
      const userWithPerms =
        yield* permissionQueries.getUserWithPermissions(userId);
      if (!userWithPerms) return false;
      return userWithPerms.roles.some((r) => r.name === roleName) || false;
    });
  },

  // Check if user has Any of the specified roles
  userHasAnyRole(userId: string, roleNames: string[]) {
    return Effect.gen(function* () {
      const userWithPerms =
        yield* permissionQueries.getUserWithPermissions(userId);
      if (!userWithPerms) return false;
      return (
        userWithPerms.roles.some((r) => roleNames.includes(r.name)) || false
      );
    });
  },

  // Check if user has ALL of the specified roles
  userHasAllRoles(userId: string, roleNames: string[]) {
    return Effect.gen(function* () {
      const userWithPerms =
        yield* permissionQueries.getUserWithPermissions(userId);
      const userRoleNames = userWithPerms?.roles.map((r) => r.name) || [];
      return roleNames.every((roleName) => userRoleNames.includes(roleName));
    });
  },

  updateRolePermissions(
    roleId: string,
    addedPermissions: string[],
    removedPermissions: string[],
  ) {
    return Effect.gen(function* () {
      // Verify role exists
      yield* rolesQueries.getRoleById(roleId);

      // Remove permissions
      if (removedPermissions.length > 0) {
        // Get permission IDs for removed permissions
        const permissionsToRemove = yield* Effect.tryPromise({
          try: () =>
            db.query.permission.findMany({
              where: inArray(permission.name, removedPermissions),
              columns: { id: true },
            }),
          catch: (error) => {
            logError(
              "permissionQueries.updateRolePermissions",
              "Error fetching permissions to remove",
              { error },
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Gagal mengambil data izin yang akan dihapus",
            });
          },
        });

        if (permissionsToRemove.length > 0) {
          const permissionIdsToRemove = permissionsToRemove.map((p) => p.id);

          yield* Effect.tryPromise({
            try: () =>
              db
                .delete(rolePermissions)
                .where(
                  and(
                    eq(rolePermissions.roleId, roleId),
                    inArray(
                      rolePermissions.permissionId,
                      permissionIdsToRemove,
                    ),
                  ),
                ),
            catch: (error) => {
              logError(
                "permissionQueries.updateRolePermissions",
                "Error removing role permissions",
                { error },
              );
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal menghapus izin dari role",
              });
            },
          });
        }
      }

      // Add new permissions
      if (addedPermissions.length > 0) {
        // Get permission IDs for added permissions
        const permissionsToAdd = yield* Effect.tryPromise({
          try: () =>
            db.query.permission.findMany({
              where: inArray(permission.name, addedPermissions),
              columns: { id: true },
            }),
          catch: (error) => {
            logError(
              "permissionQueries.updateRolePermissions",
              "Error fetching permissions to add",
              { error },
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Gagal mengambil data izin yang akan ditambahkan",
            });
          },
        });

        if (permissionsToAdd.length > 0) {
          const newRolePermissions = permissionsToAdd.map((p) => ({
            roleId,
            permissionId: p.id,
          }));

          yield* Effect.tryPromise({
            try: () =>
              db
                .insert(rolePermissions)
                .values(newRolePermissions)
                .onConflictDoNothing(),
            catch: (error) => {
              logError(
                "permissionQueries.updateRolePermissions",
                "Error adding role permissions",
                { error },
              );
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal menambahkan izin ke role",
              });
            },
          });
        }
      }

      return { success: true };
    });
  },
};
export default permissionQueries;
