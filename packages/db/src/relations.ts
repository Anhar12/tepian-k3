import { relations } from "drizzle-orm";
import {
  clusters,
  districts,
  kblis,
  parameterCategories,
  parameters,
  permission,
  provinces,
  regencies,
  rolePermissions,
  roles,
  userCompanies,
  userCompanyTestingLocation,
  userPermissions,
  userRoles,
  users,
  villages,
} from "./schema";

export const userRelations = relations(users, ({ many }) => ({
  userCompanies: many(userCompanies),
  roles: many(userRoles),
}));

export const kbliRelations = relations(kblis, ({ many }) => ({
  userCompanies: many(userCompanies),
}));

export const userCompanyRelations = relations(
  userCompanies,
  ({ one, many }) => ({
    user: one(users, {
      fields: [userCompanies.userId],
      references: [users.id],
    }),
    kbli: one(kblis, {
      fields: [userCompanies.kbliId],
      references: [kblis.id],
    }),
    province: one(provinces, {
      fields: [userCompanies.provinceId],
      references: [provinces.id],
    }),
    district: one(districts, {
      fields: [userCompanies.districtId],
      references: [districts.id],
    }),
    regency: one(regencies, {
      fields: [userCompanies.regencyId],
      references: [regencies.id],
    }),
    village: one(villages, {
      fields: [userCompanies.villageId],
      references: [villages.id],
    }),
    testingLocation: many(userCompanyTestingLocation),
  })
);

export const userCompanyTestingLocationRelations = relations(
  userCompanyTestingLocation,
  ({ one }) => ({
    userCompany: one(userCompanies, {
      fields: [userCompanyTestingLocation.userCompanyId],
      references: [userCompanies.id],
    }),
    regency: one(regencies, {
      fields: [userCompanyTestingLocation.regencyId],
      references: [regencies.id],
    }),
    district: one(districts, {
      fields: [userCompanyTestingLocation.districtId],
      references: [districts.id],
    }),
  })
);

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

export const clustersRelations = relations(users, ({ many }) => ({
  parameterCategories: many(parameterCategories),
  parameters: many(parameters),
}));

export const parameterCategoriesRelations = relations(
  parameterCategories,
  ({ one, many }) => ({
    cluster: one(clusters, {
      fields: [parameterCategories.clusterId],
      references: [clusters.id],
    }),
    parameters: many(parameters),
  })
);

export const parametersRelations = relations(parameters, ({ one }) => ({
  category: one(parameterCategories, {
    fields: [parameters.parameterCategoryId],
    references: [parameterCategories.id],
  }),
}));

export const provinceRelations = relations(provinces, ({ many }) => ({
  regencies: many(regencies),
}));

export const regencyRelations = relations(regencies, ({ one, many }) => ({
  province: one(provinces, {
    fields: [regencies.provinceId],
    references: [provinces.id],
  }),
  districts: many(districts),
}));

export const districtRelations = relations(districts, ({ one, many }) => ({
  regency: one(regencies, {
    fields: [districts.regencyId],
    references: [regencies.id],
  }),
  villages: many(villages),
}));

export const villageRelations = relations(villages, ({ one }) => ({
  district: one(districts, {
    fields: [villages.districtId],
    references: [districts.id],
  }),
}));
