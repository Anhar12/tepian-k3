/**
 * All database resources that require permission management.
 * This list is derived from the database schema tables.
 */
export const RESOURCES = [
  // ==================== USERS & AUTH ====================
  "users",
  "roles",
  "permissions",
  "role-permissions",
  "user-permissions",

  // ==================== TOOLS ====================
  "tool-codes",
  "tools",
  "tool-calibrations",
  "tool-checks",
  "tool-certifications",
  "tool-documentations",
  "chemical-materials",
  "clusters",
  "parameter-categories",
  "parameters",
  "parameter-tool",
  "parameter-chemical-material",

  // ==================== GEOGRAPHY ====================
  "provinces",
  "regency",
  "district",
  "village",
  "kbli",

  // ==================== USER COMPANIES ====================
  "user-company",
  "user-company-testing-location",

  // ==================== BANNERS ====================
  "banners",

  // ==================== NEWS ====================
  "news",

  // ==================== CART ====================
  "cart",

  // ==================== ORDERS ====================
  "orders",
  "orders-approval", // Approve / reject order (admin, lab_manager, head_of_institution)
  "orders-payment", // Verify / reject payment (treasurer)
  "order-items",
  "order-status-history",

  // ==================== TESTING ====================
  "testing",
  "testing-item",

  // ==================== DOCUMENTS ====================
  "documents",
  "document-signature",
  "document-verifications",
  "documents-spt", // SPT / Assignment Letter generation & upload (penjadwalan, head_of_institution)
  "documents-admin", // Admin documents: offering letter, SPK, tagihan (admin_manager)

  // ==================== AUDITS ====================
  "audits",

  // ==================== EMPLOYEES ====================
  "positions",
  "employees",

  // ==================== WORKSHEETS ====================
  "worksheets",
  "worksheets-status", // Workflow transitions: verify, requestRevision, complete, syncToTesting, updateStatus
  "worksheets-parameters",
  "worksheets-personnel-assignments",
  "worksheets-transaction-details",
  "worksheet-items",
  "worksheet-tools",
  "worksheet-notes",
  "worksheet-assignments",
  "worksheet-chemical-materials",

  // ==================== SURVEY ====================
  "survey-questions",
  "survey-responses",
  "survey-feedback",

  // ==================== NOTIFICATIONS ====================
  "notifications",

  // ==================== SYSTEM ====================
  "logs",
] as const;

export type Resource = (typeof RESOURCES)[number];
