import { and, eq, inArray, isNull } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import {
  permission,
  rolePermissions,
  roles,
  userPermissions,
  userRoles,
  users,
} from "@tepian-k3/db/schema";
import logger from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import type { Permission } from "@tepian-k3/types/permission.types";

const permissionQueries = {
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
          logger.error("Error fetching user", { error });
          return new TRPCError({
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
          logger.error("Error fetching user roles", { error });
          return new TRPCError({
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
                eq(rolePermissions.permissionId, permission.id)
              )
              .where(inArray(rolePermissions.roleId, roleIds));

            rolePerms = rolePermsData.map((rp) => rp.permission);
          },
          catch: (error) => {
            logger.error("Error fetching role permissions", { error });
            return new TRPCError({
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
              eq(userPermissions.permissionId, permission.id)
            )
            .where(eq(userPermissions.userId, user.id)),

        catch: (error) => {
          logger.error("Error fetching user permissions", { error });
          return new TRPCError({
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
      const userWithPerms = yield* permissionQueries.getUserWithPermissions(
        userId
      );
      if (!userWithPerms) return false;
      return userWithPerms.permissions.includes(permissionName) || false;
    });
  },

  // Check if user has specific role
  userHasRole(userId: string, roleName: string) {
    return Effect.gen(function* () {
      const userWithPerms = yield* permissionQueries.getUserWithPermissions(
        userId
      );
      if (!userWithPerms) return false;
      return userWithPerms.roles.some((r) => r.name === roleName) || false;
    });
  },

  // Check if user has Any of the specified roles
  userHasAnyRole(userId: string, roleNames: string[]) {
    return Effect.gen(function* () {
      const userWithPerms = yield* permissionQueries.getUserWithPermissions(
        userId
      );
      if (!userWithPerms) return false;
      return (
        userWithPerms.roles.some((r) => roleNames.includes(r.name)) || false
      );
    });
  },

  // Check if user has ALL of the specified roles
  userHasAllRoles(userId: string, roleNames: string[]) {
    return Effect.gen(function* () {
      const userWithPerms = yield* permissionQueries.getUserWithPermissions(
        userId
      );
      const userRoleNames = userWithPerms?.roles.map((r) => r.name) || [];
      return roleNames.every((roleName) => userRoleNames.includes(roleName));
    });
  },

  // Assign role to user
  assignRole(userId: string, roleId: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .insert(userRoles)
          .values({
            userId,
            roleId,
          })
          .onConflictDoNothing()
          .returning(),
      catch: (error) => {
        logger.error("Error assigning role to user", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menetapkan peran ke user",
        });
      },
    });
  },

  // Assign multiple rols to user
  assignRoles(userId: string, roleIds: string[]) {
    if (roleIds.length === 0) return;

    return Effect.tryPromise({
      try: () =>
        db
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
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menetapkan peran ke user",
        });
      },
    });
  },
  // Remove role from user
  removeRole(userId: string, roleId: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .delete(userRoles)
          .where(
            and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))
          )
          .returning(),
      catch: (error) => {
        logger.error("Error removing role from user", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus peran dari user",
        });
      },
    });
  },

  // Remove all roles from user
  removeAllRoles(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.delete(userRoles).where(eq(userRoles.userId, userId)).returning(),
      catch: (error) => {
        logger.error("Error removing all roles from user", { error });
        return new TRPCError({
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
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengganti peran user",
        });
      },
    });
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

  // Grant permission to user (override)
  grantPermission(userId: string, permissionId: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .insert(userPermissions)
          .values({
            userId,
            permissionId,
            granted: true,
          })
          .onConflictDoUpdate({
            target: [userPermissions.userId, userPermissions.permissionId],
            set: { granted: true },
          })
          .returning(),
      catch: (error) => {
        logger.error("Error granting permission to user", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memberikan izin ke user",
        });
      },
    });
  },

  // Revoke permission from user (override)
  revokePermission(userId: string, permissionId: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .insert(userPermissions)
          .values({
            userId,
            permissionId,
            granted: false,
          })
          .onConflictDoUpdate({
            target: [userPermissions.userId, userPermissions.permissionId],
            set: { granted: false },
          })
          .returning(),
      catch: (error) => {
        logger.error("Error revoking permission from user", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mencabut izin dari user",
        });
      },
    });
  },
};

export default permissionQueries;
