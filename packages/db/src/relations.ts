import { relations } from "drizzle-orm";
import {
  permission,
  rolePermissions,
  roles,
  userCompanies,
  userPermissions,
  userRoles,
  users,
} from "./schema";

export const userRelations = relations(users, ({ many }) => ({
  userCompanies: many(userCompanies),
  roles: many(userRoles),
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permission, {
      fields: [rolePermissions.permissionId],
      references: [permission.id],
    }),
  })
);

export const userPermissionsRelations = relations(
  userPermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [userPermissions.userId],
      references: [users.id],
    }),
    permission: one(permission, {
      fields: [userPermissions.permissionId],
      references: [permission.id],
    }),
  })
);
