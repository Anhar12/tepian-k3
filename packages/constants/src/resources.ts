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
  "tools",
  "tool-calibrations",
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

  // ==================== CART ====================
  "cart",

  // ==================== ORDERS ====================
  "orders",
  "order-items",
  "order-status-history",

  // ==================== TESTING ====================
  "testing",
  "testing-item",

  // ==================== DOCUMENTS ====================
  "documents",
  "document-signature",
  "document-verifications",

  // ==================== AUDITS ====================
  "audits",

  // ==================== EMPLOYEES ====================
  "positions",
  "employees",

  // ==================== WORKSHEETS ====================
  "worksheets",
  "worksheet-items",
  "worksheet-tools",
  "worksheet-notes",
  "worksheet-assignments",
  "worksheet-chemical-materials",

  // ==================== NOTIFICATIONS ====================
  "notifications",
] as const;

export type Resource = (typeof RESOURCES)[number];
