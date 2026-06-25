import { relations } from "drizzle-orm";
import {
  cart,
  chemicalMaterials,
  clusters,
  districts,
  documents,
  documentSignatures,
  documentVerifications,
  employeeCertifications,
  employees,
  kblis,
  order,
  orderItem,
  orderStatusHistory,
  parameterCategories,
  parameterChemicalMaterials,
  parameters,
  parameterTools,
  pelatihan,
  pelatihanCategories,
  pelatihanCart,
  pelatihanModules,
  pelatihanMaterials,
  pelatihanAssessments,
  pelatihanQuestions,
  pelatihanQuestionOptions,
  pelatihanEnrollments,
  pelatihanOrders,
  pelatihanOrderItems,
  pelatihanAssessmentAttempts,
  pelatihanAssessmentAnswers,
  pelatihanCertificates,
  pelatihanProgress,
  pelatihanSchedules,
  pelatihanAttendances,
  permission,
  positions,
  provinces,
  regencies,
  rolePermissions,
  roles,
  surveyFeedback,
  surveyQuestions,
  surveyResponses,
  testing,
  testingItem,
  toolCalibrationCertificates,
  toolCalibrationDocumentations,
  toolCalibrations,
  toolCodes,
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
  worksheetToolNeeded,
  worksheetTools,
  userTrainingProfiles,
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
  trainingProfile: one(userTrainingProfiles, {
    fields: [users.id],
    references: [userTrainingProfiles.userId],
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

export const toolsRelations = relations(tools, ({ one, many }) => ({
  toolCode: one(toolCodes, {
    fields: [tools.toolCodeId],
    references: [toolCodes.id],
  }),
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

export const clustersRelations = relations(clusters, ({ many }) => ({
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
  // Survey kepuasan
  surveyResponses: many(surveyResponses),
  surveyFeedback: one(surveyFeedback, {
    fields: [order.id],
    references: [surveyFeedback.orderId],
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
  pelatihan: one(pelatihan, {
    fields: [orderItem.pelatihanId],
    references: [pelatihan.id],
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
  plannedTools: many(worksheetToolNeeded),
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

export const worksheetToolNeededRelations = relations(
  worksheetToolNeeded,
  ({ one }) => ({
    worksheet: one(worksheets, {
      fields: [worksheetToolNeeded.worksheetId],
      references: [worksheets.id],
    }),
    tool: one(tools, {
      fields: [worksheetToolNeeded.toolId],
      references: [tools.id],
    }),
  }),
);

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
    changedByUser: one(users, {
      fields: [orderStatusHistory.changedBy],
      references: [users.id],
      relationName: "orderStatusHistoryChangedBy",
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

export const employeeRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  certifications: many(employeeCertifications),
}));

export const employeeCertificationsRelations = relations(
  employeeCertifications,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeCertifications.employeeId],
      references: [employees.id],
    }),
  }),
);

// ==================== SURVEY KEPUASAN RELATIONS ====================

export const surveyQuestionRelations = relations(
  surveyQuestions,
  ({ many }) => ({
    responses: many(surveyResponses),
  }),
);

export const surveyResponseRelations = relations(
  surveyResponses,
  ({ one }) => ({
    order: one(order, {
      fields: [surveyResponses.orderId],
      references: [order.id],
    }),
    question: one(surveyQuestions, {
      fields: [surveyResponses.questionId],
      references: [surveyQuestions.id],
    }),
  }),
);

export const surveyFeedbackRelations = relations(surveyFeedback, ({ one }) => ({
  order: one(order, {
    fields: [surveyFeedback.orderId],
    references: [order.id],
  }),
  submittedBy: one(users, {
    fields: [surveyFeedback.submittedByUserId],
    references: [users.id],
  }),
}));

// ==================== PELATIHAN RELATIONS ====================

export const pelatihanCategoryRelations = relations(
  pelatihanCategories,
  ({ many }) => ({
    pelatihans: many(pelatihan),
  }),
);

export const pelatihanRelations = relations(pelatihan, ({ one, many }) => ({
  category: one(pelatihanCategories, {
    fields: [pelatihan.categoryId],
    references: [pelatihanCategories.id],
  }),
  modules: many(pelatihanModules),
  materials: many(pelatihanMaterials),
  assessments: many(pelatihanAssessments),
  enrollments: many(pelatihanEnrollments),
  cartItems: many(pelatihanCart),
  schedules: many(pelatihanSchedules),
}));

export const pelatihanModuleRelations = relations(
  pelatihanModules,
  ({ one, many }) => ({
    pelatihan: one(pelatihan, {
      fields: [pelatihanModules.pelatihanId],
      references: [pelatihan.id],
    }),
    materials: many(pelatihanMaterials),
  }),
);

export const pelatihanCartRelations = relations(pelatihanCart, ({ one }) => ({
  pelatihan: one(pelatihan, {
    fields: [pelatihanCart.pelatihanId],
    references: [pelatihan.id],
  }),
  user: one(users, {
    fields: [pelatihanCart.userId],
    references: [users.id],
  }),
}));

export const pelatihanOrderRelations = relations(
  pelatihanOrders,
  ({ one, many }) => ({
    user: one(users, {
      fields: [pelatihanOrders.userId],
      references: [users.id],
    }),
    approvedBy: one(users, {
      fields: [pelatihanOrders.approvedBy],
      references: [users.id],
      relationName: "pelatihanOrderApprover",
    }),
    verifiedBy: one(users, {
      fields: [pelatihanOrders.verifiedBy],
      references: [users.id],
      relationName: "pelatihanOrderVerifier",
    }),
    items: many(pelatihanOrderItems),
    enrollments: many(pelatihanEnrollments),
  }),
);

export const pelatihanOrderItemRelations = relations(
  pelatihanOrderItems,
  ({ one }) => ({
    order: one(pelatihanOrders, {
      fields: [pelatihanOrderItems.orderId],
      references: [pelatihanOrders.id],
    }),
    pelatihan: one(pelatihan, {
      fields: [pelatihanOrderItems.pelatihanId],
      references: [pelatihan.id],
    }),
  }),
);

export const pelatihanMaterialRelations = relations(
  pelatihanMaterials,
  ({ one }) => ({
    pelatihan: one(pelatihan, {
      fields: [pelatihanMaterials.pelatihanId],
      references: [pelatihan.id],
    }),
    module: one(pelatihanModules, {
      fields: [pelatihanMaterials.moduleId],
      references: [pelatihanModules.id],
    }),
  }),
);

export const pelatihanAssessmentRelations = relations(
  pelatihanAssessments,
  ({ one, many }) => ({
    pelatihan: one(pelatihan, {
      fields: [pelatihanAssessments.pelatihanId],
      references: [pelatihan.id],
    }),
    questions: many(pelatihanQuestions),
  }),
);

export const pelatihanQuestionRelations = relations(
  pelatihanQuestions,
  ({ one, many }) => ({
    assessment: one(pelatihanAssessments, {
      fields: [pelatihanQuestions.assessmentId],
      references: [pelatihanAssessments.id],
    }),
    options: many(pelatihanQuestionOptions),
  }),
);

export const pelatihanQuestionOptionRelations = relations(
  pelatihanQuestionOptions,
  ({ one }) => ({
    question: one(pelatihanQuestions, {
      fields: [pelatihanQuestionOptions.questionId],
      references: [pelatihanQuestions.id],
    }),
  }),
);

export const pelatihanEnrollmentRelations = relations(
  pelatihanEnrollments,
  ({ one, many }) => ({
    pelatihan: one(pelatihan, {
      fields: [pelatihanEnrollments.pelatihanId],
      references: [pelatihan.id],
    }),
    user: one(users, {
      fields: [pelatihanEnrollments.userId],
      references: [users.id],
    }),
    order: one(pelatihanOrders, {
      fields: [pelatihanEnrollments.orderId],
      references: [pelatihanOrders.id],
    }),
    companyProvince: one(provinces, {
      fields: [pelatihanEnrollments.companyProvinceId],
      references: [provinces.id],
    }),
    companyRegency: one(regencies, {
      fields: [pelatihanEnrollments.companyRegencyId],
      references: [regencies.id],
    }),
    companyDistrict: one(districts, {
      fields: [pelatihanEnrollments.companyDistrictId],
      references: [districts.id],
    }),
    progresses: many(pelatihanProgress),
    attempts: many(pelatihanAssessmentAttempts),
    certificates: many(pelatihanCertificates),
    attendances: many(pelatihanAttendances),
  }),
);

export const pelatihanProgressRelations = relations(
  pelatihanProgress,
  ({ one }) => ({
    enrollment: one(pelatihanEnrollments, {
      fields: [pelatihanProgress.enrollmentId],
      references: [pelatihanEnrollments.id],
    }),
    material: one(pelatihanMaterials, {
      fields: [pelatihanProgress.materialId],
      references: [pelatihanMaterials.id],
    }),
  }),
);

export const pelatihanAttemptRelations = relations(
  pelatihanAssessmentAttempts,
  ({ one, many }) => ({
    enrollment: one(pelatihanEnrollments, {
      fields: [pelatihanAssessmentAttempts.enrollmentId],
      references: [pelatihanEnrollments.id],
    }),
    assessment: one(pelatihanAssessments, {
      fields: [pelatihanAssessmentAttempts.assessmentId],
      references: [pelatihanAssessments.id],
    }),
    answers: many(pelatihanAssessmentAnswers),
  }),
);

export const pelatihanAnswerRelations = relations(
  pelatihanAssessmentAnswers,
  ({ one }) => ({
    attempt: one(pelatihanAssessmentAttempts, {
      fields: [pelatihanAssessmentAnswers.attemptId],
      references: [pelatihanAssessmentAttempts.id],
    }),
    question: one(pelatihanQuestions, {
      fields: [pelatihanAssessmentAnswers.questionId],
      references: [pelatihanQuestions.id],
    }),
  }),
);

export const pelatihanCertificateRelations = relations(
  pelatihanCertificates,
  ({ one }) => ({
    enrollment: one(pelatihanEnrollments, {
      fields: [pelatihanCertificates.enrollmentId],
      references: [pelatihanEnrollments.id],
    }),
  }),
);

// ##################
// authored (generated by gemini, Jun 03 2026 17:42 WITA)
// ##################

export const pelatihanScheduleRelations = relations(
  pelatihanSchedules,
  ({ one, many }) => ({
    pelatihan: one(pelatihan, {
      fields: [pelatihanSchedules.pelatihanId],
      references: [pelatihan.id],
    }),
    attendances: many(pelatihanAttendances),
  }),
);

export const pelatihanAttendanceRelations = relations(
  pelatihanAttendances,
  ({ one }) => ({
    enrollment: one(pelatihanEnrollments, {
      fields: [pelatihanAttendances.enrollmentId],
      references: [pelatihanEnrollments.id],
    }),
    schedule: one(pelatihanSchedules, {
      fields: [pelatihanAttendances.scheduleId],
      references: [pelatihanSchedules.id],
    }),
  }),
);

export const userTrainingProfileRelations = relations(
  userTrainingProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [userTrainingProfiles.userId],
      references: [users.id],
    }),
    companyProvince: one(provinces, {
      fields: [userTrainingProfiles.companyProvinceId],
      references: [provinces.id],
    }),
    companyRegency: one(regencies, {
      fields: [userTrainingProfiles.companyRegencyId],
      references: [regencies.id],
    }),
    companyDistrict: one(districts, {
      fields: [userTrainingProfiles.companyDistrictId],
      references: [districts.id],
    }),
    participantProvince: one(provinces, {
      fields: [userTrainingProfiles.participantProvinceId],
      references: [provinces.id],
    }),
    participantRegency: one(regencies, {
      fields: [userTrainingProfiles.participantRegencyId],
      references: [regencies.id],
    }),
    participantDistrict: one(districts, {
      fields: [userTrainingProfiles.participantDistrictId],
      references: [districts.id],
    }),
  }),
);

// ##################
// end authored
// ##################
