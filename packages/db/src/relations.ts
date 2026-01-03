import { relations } from "drizzle-orm";
import {
  cart,
  clusters,
  districts,
  kblis,
  order,
  orderItem,
  orderStatusHistory,
  parameterCategories,
  parameters,
  parameterTools,
  permission,
  provinces,
  regencies,
  rolePermissions,
  roles,
  testing,
  testingItem,
  tools,
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
  cart: many(cart),
  testing: many(testing),
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
    testing: many(testing),
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
  users: many(userRoles),
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

export const toolsRelations = relations(tools, ({ many }) => ({
  parameterTools: many(parameterTools),
}));

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

export const parametersRelations = relations(parameters, ({ one, many }) => ({
  category: one(parameterCategories, {
    fields: [parameters.parameterCategoryId],
    references: [parameterCategories.id],
  }),
  tools: many(parameterTools),
}));

export const parameterToolsRelations = relations(parameterTools, ({ one }) => ({
  parameter: one(parameters, {
    fields: [parameterTools.parameterId],
    references: [parameters.id],
  }),
  tool: one(tools, {
    fields: [parameterTools.toolId],
    references: [tools.id],
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

export const cartRelations = relations(cart, ({ one }) => ({
  user: one(users, {
    fields: [cart.userId],
    references: [users.id],
  }),
  company: one(userCompanies, {
    fields: [cart.companyId],
    references: [userCompanies.id],
  }),
  location: one(userCompanyTestingLocation, {
    fields: [cart.locationId],
    references: [userCompanyTestingLocation.id],
  }),
  parameter: one(parameters, {
    fields: [cart.parameterId],
    references: [parameters.id],
  }),
}));

export const testingRelations = relations(testing, ({ one, many }) => ({
  user: one(users, {
    fields: [testing.userId],
    references: [users.id],
  }),
  company: one(userCompanies, {
    fields: [testing.companyId],
    references: [userCompanies.id],
  }),
  location: one(userCompanyTestingLocation, {
    fields: [testing.locationId],
    references: [userCompanyTestingLocation.id],
  }),
  items: many(testingItem),
}));

export const testingItemRelations = relations(testingItem, ({ one }) => ({
  testing: one(testing, {
    fields: [testingItem.testingId],
    references: [testing.id],
  }),
  parameter: one(parameters, {
    fields: [testingItem.parameterId],
    references: [parameters.id],
  }),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(users, {
    fields: [order.userId],
    references: [users.id],
  }),
  company: one(userCompanies, {
    fields: [order.companyId],
    references: [userCompanies.id],
  }),
  location: one(userCompanyTestingLocation, {
    fields: [order.locationId],
    references: [userCompanyTestingLocation.id],
  }),
  item: many(orderItem),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  parameter: one(parameters, {
    fields: [orderItem.parameterId],
    references: [parameters.id],
  }),
}));

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(order, {
      fields: [orderStatusHistory.orderId],
      references: [order.id],
    }),
  })
);
