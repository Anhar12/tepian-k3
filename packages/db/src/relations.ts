import { relations } from "drizzle-orm";
import {
  cart,
  chemicalMaterials,
  clusters,
  districts,
  documents,
  documentSignatures,
  documentVerifications,
  employees,
  kblis,
  order,
  orderItem,
  orderStatusHistory,
  parameterCategories,
  parameterChemicalMaterials,
  parameters,
  parameterTools,
  permission,
  positions,
  provinces,
  regencies,
  rolePermissions,
  roles,
  testing,
  testingItem,
  toolCalibrationCertificates,
  toolCalibrationDocumentations,
  toolCalibrations,
  tools,
  userCompanies,
  userCompanyTestingLocation,
  userPermissions,
  userRoles,
  users,
  villages,
  worksheetAssignments,
  worksheetChemicalMaterials,
  worksheetItems,
  worksheetNotes,
  worksheetOperationalCosts,
  worksheets,
  worksheetTools,
} from "./schema";

export const userRelations = relations(users, ({ many, one }) => ({
  userCompanies: many(userCompanies),
  roles: many(userRoles),
  cart: many(cart),
  testing: many(testing),
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
    relationName: "employeeManager",
  }),
  // Polymorphic relation: documents where entityType = 'user' and entityId = user.id
  documents: many(documents, {
    relationName: "userDocuments",
  }),
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
    // Polymorphic relation: documents where entityType = 'user_company' and entityId = userCompany.id
    documents: many(documents, {
      relationName: "userCompanyDocuments",
    }),
  }),
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
  }),
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
  }),
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
  }),
);

export const toolsRelations = relations(tools, ({ many }) => ({
  parameterTools: many(parameterTools),
  calibrations: many(toolCalibrations),
}));

export const toolCalibrationsRelations = relations(
  toolCalibrations,
  ({ one, many }) => ({
    tool: one(tools, {
      fields: [toolCalibrations.toolId],
      references: [tools.id],
    }),
    certificate: one(toolCalibrationCertificates, {
      fields: [toolCalibrations.id],
      references: [toolCalibrationCertificates.toolCalibrationId],
    }),
    documentations: many(toolCalibrationDocumentations),
  }),
);

export const toolCalibrationCertificateRelations = relations(
  toolCalibrationCertificates,
  ({ one }) => ({
    toolCalibration: one(toolCalibrations, {
      fields: [toolCalibrationCertificates.toolCalibrationId],
      references: [toolCalibrations.id],
    }),
  }),
);

export const toolCalibrationDocumentationRelations = relations(
  toolCalibrationDocumentations,
  ({ one }) => ({
    toolCalibration: one(toolCalibrations, {
      fields: [toolCalibrationDocumentations.toolCalibrationId],
      references: [toolCalibrations.id],
    }),
  }),
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
  }),
);

export const parametersRelations = relations(parameters, ({ one, many }) => ({
  category: one(parameterCategories, {
    fields: [parameters.parameterCategoryId],
    references: [parameterCategories.id],
  }),
  tools: many(parameterTools),
  chemicalMaterials: many(parameterChemicalMaterials),
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

export const chemicalMaterialsRelations = relations(
  chemicalMaterials,
  ({ many }) => ({
    parameters: many(parameterChemicalMaterials),
    worksheets: many(worksheetChemicalMaterials),
  }),
);

export const parameterChemicalMaterialsRelations = relations(
  parameterChemicalMaterials,
  ({ one }) => ({
    parameter: one(parameters, {
      fields: [parameterChemicalMaterials.parameterId],
      references: [parameters.id],
    }),
    chemicalMaterial: one(chemicalMaterials, {
      fields: [parameterChemicalMaterials.chemicalMaterialId],
      references: [chemicalMaterials.id],
    }),
  }),
);

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

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(users, {
    fields: [order.userId],
    references: [users.id],
  }),
  company: one(userCompanies, {
    fields: [order.companyId],
    references: [userCompanies.id],
  }),
  testing: one(testing, {
    fields: [order.id],
    references: [testing.orderId],
  }),
  worksheet: one(worksheets, {
    fields: [order.id],
    references: [worksheets.orderId],
  }),
  items: many(orderItem),
  statusHistory: many(orderStatusHistory),
  // Polymorphic relation: documents where entityType = 'order' and entityId = order.id
  documents: many(documents, {
    relationName: "orderDocuments",
  }),
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
  location: one(userCompanyTestingLocation, {
    fields: [orderItem.locationId],
    references: [userCompanyTestingLocation.id],
  }),
}));

export const worksheetRelations = relations(worksheets, ({ one, many }) => ({
  order: one(order, {
    fields: [worksheets.orderId],
    references: [order.id],
  }),
  testing: one(testing, {
    fields: [worksheets.id],
    references: [testing.worksheetId],
  }),
  mainSupervisor: one(employees, {
    fields: [worksheets.mainSupervisorId],
    references: [employees.id],
  }),
  accompanyingSupervisor: one(employees, {
    fields: [worksheets.accompanyingSupervisorId],
    references: [employees.id],
  }),
  createdBy: one(users, {
    fields: [worksheets.createdBy],
    references: [users.id],
  }),
  assignments: many(worksheetAssignments),
  items: many(worksheetItems),
  tools: many(worksheetTools),
  chemicalMaterials: many(worksheetChemicalMaterials),
  notes: many(worksheetNotes),
  operationalCosts: many(worksheetOperationalCosts),
}));

export const worksheetItemRelations = relations(worksheetItems, ({ one }) => ({
  worksheet: one(worksheets, {
    fields: [worksheetItems.worksheetId],
    references: [worksheets.id],
  }),
  parameter: one(parameters, {
    fields: [worksheetItems.parameterId],
    references: [parameters.id],
  }),
  location: one(userCompanyTestingLocation, {
    fields: [worksheetItems.locationId],
    references: [userCompanyTestingLocation.id],
  }),
}));

export const worksheetToolRelations = relations(worksheetTools, ({ one }) => ({
  worksheet: one(worksheets, {
    fields: [worksheetTools.worksheetId],
    references: [worksheets.id],
  }),
  tool: one(tools, {
    fields: [worksheetTools.toolId],
    references: [tools.id],
  }),
}));

export const worksheetChemicalMaterialRelations = relations(
  worksheetChemicalMaterials,
  ({ one }) => ({
    worksheet: one(worksheets, {
      fields: [worksheetChemicalMaterials.worksheetId],
      references: [worksheets.id],
    }),
    chemicalMaterial: one(chemicalMaterials, {
      fields: [worksheetChemicalMaterials.chemicalMaterialId],
      references: [chemicalMaterials.id],
    }),
  }),
);

export const worksheetNoteRelations = relations(worksheetNotes, ({ one }) => ({
  worksheet: one(worksheets, {
    fields: [worksheetNotes.worksheetId],
    references: [worksheets.id],
  }),
  createdBy: one(users, {
    fields: [worksheetNotes.createdBy],
    references: [users.id],
  }),
}));

export const worksheetAssignmentRelations = relations(
  worksheetAssignments,
  ({ one }) => ({
    worksheet: one(worksheets, {
      fields: [worksheetAssignments.worksheetId],
      references: [worksheets.id],
    }),
    employee: one(employees, {
      fields: [worksheetAssignments.employeeId],
      references: [employees.id],
    }),
    assignedBy: one(users, {
      fields: [worksheetAssignments.assignedBy],
      references: [users.id],
    }),
  }),
);

export const worksheetOperationalCostRelations = relations(
  worksheetOperationalCosts,
  ({ one }) => ({
    worksheet: one(worksheets, {
      fields: [worksheetOperationalCosts.worksheetId],
      references: [worksheets.id],
    }),
  }),
);

export const testingRelations = relations(testing, ({ one, many }) => ({
  order: one(order, {
    fields: [testing.orderId],
    references: [order.id],
  }),
  user: one(users, {
    fields: [testing.userId],
    references: [users.id],
  }),
  company: one(userCompanies, {
    fields: [testing.companyId],
    references: [userCompanies.id],
  }),
  type: one(parameterCategories, {
    fields: [testing.testingType],
    references: [parameterCategories.id],
  }),
  items: many(testingItem),
  // Polymorphic relation: documents where entityType = 'testing' and entityId = testing.id
  documents: many(documents, {
    relationName: "testingDocuments",
  }),
}));

export const testingItemRelations = relations(testingItem, ({ one }) => ({
  testing: one(testing, {
    fields: [testingItem.testingId],
    references: [testing.id],
  }),
  orderItem: one(orderItem, {
    fields: [testingItem.orderItemId],
    references: [orderItem.id],
  }),
  parameter: one(parameters, {
    fields: [testingItem.parameterId],
    references: [parameters.id],
  }),
  location: one(userCompanyTestingLocation, {
    fields: [testingItem.locationId],
    references: [userCompanyTestingLocation.id],
  }),
}));

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(order, {
      fields: [orderStatusHistory.orderId],
      references: [order.id],
    }),
  }),
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedByUserId],
    references: [users.id],
    relationName: "documentUploadedBy",
  }),
  signedBy: one(users, {
    fields: [documents.signedByUserId],
    references: [users.id],
    relationName: "documentSignedBy",
  }),
  verifications: many(documentVerifications),
  signatures: many(documentSignatures),
  // Polymorphic relations - one of these will be populated based on entityType
  order: one(order, {
    fields: [documents.entityId],
    references: [order.id],
    relationName: "orderDocuments",
  }),
  testing: one(testing, {
    fields: [documents.entityId],
    references: [testing.id],
    relationName: "testingDocuments",
  }),
  userCompany: one(userCompanies, {
    fields: [documents.entityId],
    references: [userCompanies.id],
    relationName: "userCompanyDocuments",
  }),
  user: one(users, {
    fields: [documents.entityId],
    references: [users.id],
    relationName: "userDocuments",
  }),
}));

export const documentVerificationsRelations = relations(
  documentVerifications,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentVerifications.documentId],
      references: [documents.id],
    }),
    verifiedBy: one(users, {
      fields: [documentVerifications.verifiedByUserId],
      references: [users.id],
    }),
  }),
);

export const documentSignaturesRelations = relations(
  documentSignatures,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentSignatures.documentId],
      references: [documents.id],
    }),
    signedBy: one(users, {
      fields: [documentSignatures.signedByUserId],
      references: [users.id],
    }),
  }),
);

export const positionRelations = relations(positions, ({ many }) => ({
  employees: many(employees),
}));

export const employeeRelations = relations(employees, ({ one }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
}));
