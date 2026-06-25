import type { PermissionApprovalAction } from "./permissions";

/**
 * Configuration for a single permission-managed resource.
 *
 * Every resource implicitly receives the base CRUD actions
 * (`view`, `create`, `read`, `update`, `delete`). The optional `approvalActions`
 * field opts the resource into additional workflow actions:
 *
 * - An array lists exactly which approval actions the resource supports.
 * - The literal `"all"` enables every approval action
 *   (`review`, `verify`, `approve`, `reject`).
 * - Omitted (or an empty array) means the resource has no approval actions.
 */
export interface ResourceConfig {
  key: string;
  approvalActions?: readonly PermissionApprovalAction[] | "all";
}

/**
 * All database resources that require permission management.
 * This list is derived from the database schema tables.
 *
 * The approval actions enabled per resource mirror the workflow gates actually
 * used across the role definitions — see {@link ROLE_PERMISSIONS}.
 */
export const RESOURCES = [
  // ==================== USERS & AUTH ====================
  { key: "users" },
  { key: "roles" },
  { key: "permissions" },
  { key: "role-permissions" },
  { key: "user-permissions" },

  // ==================== IMPORT / EXPORT ====================
  { key: "pengujian-import-export" },

  // ==================== TOOLS ====================
  { key: "tool-codes" },
  { key: "tools" },
  { key: "tool-calibrations", approvalActions: ["verify"] },
  { key: "tool-checks", approvalActions: ["verify"] },
  { key: "tool-certifications" },
  { key: "tool-documentations" },
  { key: "chemical-materials" },
  { key: "clusters" },
  { key: "parameter-categories" },
  { key: "parameters" },
  { key: "parameter-tool" },
  { key: "parameter-chemical-material" },

  // ==================== GEOGRAPHY ====================
  { key: "provinces" },
  { key: "regency" },
  { key: "district" },
  { key: "village" },
  { key: "kbli" },

  // ==================== USER COMPANIES ====================
  { key: "user-company", approvalActions: ["review", "verify"] },
  {
    key: "user-company-testing-location",
    approvalActions: ["review", "verify"],
  },

  // ==================== BANNERS ====================
  { key: "banners" },

  // ==================== NEWS ====================
  { key: "news" },

  // ==================== MEDIA & PUBLICATIONS ====================
  { key: "media-publications" },

  // ==================== PPID ====================
  { key: "ppid-documents" },
  { key: "ppid-submissions", approvalActions: "all" },

  // ==================== CART ====================
  { key: "cart" },

  // ==================== ORDERS ====================
  { key: "orders", approvalActions: "all" },
  // Approve / reject order (admin, lab_manager, head_of_institution)
  { key: "orders-approval", approvalActions: "all" },
  // Verify / reject payment (treasurer)
  { key: "orders-payment", approvalActions: "all" },
  { key: "order-items" },
  { key: "order-status-history" },

  // ==================== TESTING ====================
  { key: "testing", approvalActions: "all" },
  { key: "testing-item", approvalActions: "all" },

  // ==================== DOCUMENTS ====================
  { key: "documents", approvalActions: "all" },
  { key: "document-signature" },
  { key: "document-verifications", approvalActions: "all" },
  // Per-document-type permissions (koordinator_administrasi creates; kepala_balai reviews/approves)
  { key: "documents-penawaran", approvalActions: "all" },
  { key: "documents-spk", approvalActions: "all" },
  { key: "documents-invoice", approvalActions: "all" },
  { key: "documents-spt", approvalActions: "all" },

  // ==================== AUDITS ====================
  { key: "audits" },

  // ==================== EMPLOYEES ====================
  { key: "positions" },
  { key: "employees" },

  // ==================== WORKSHEETS ====================
  { key: "worksheets", approvalActions: "all" },
  // Workflow transitions: verify, requestRevision, complete, syncToTesting, updateStatus
  {
    key: "worksheets-status",
    approvalActions: "all",
  },
  {
    key: "worksheets-parameters",
    approvalActions: "all",
  },
  {
    key: "worksheets-personnel-assignments",
    approvalActions: "all",
  },
  {
    key: "worksheets-transaction-details",
    approvalActions: "all",
  },
  { key: "worksheet-items", approvalActions: "all" },
  { key: "worksheet-tools", approvalActions: "all" },
  { key: "worksheet-notes" },
  { key: "worksheet-assignments", approvalActions: "all" },
  {
    key: "worksheet-chemical-materials",
    approvalActions: "all",
  },

  // ==================== PELATIHAN ====================
  { key: "pelatihan", approvalActions: "all" },
  { key: "pelatihan-categories" },
  { key: "pelatihan-cart" },
  { key: "pelatihan-materials" },
  { key: "pelatihan-assessments" },
  { key: "pelatihan-questions" },
  { key: "pelatihan-enrollments", approvalActions: "all" },
  { key: "pelatihan-progress" },
  { key: "pelatihan-assessment-attempts" },
  { key: "pelatihan-certificates", approvalActions: ["approve", "reject"] },

  // ==================== SURVEY ====================
  { key: "survey-questions" },
  { key: "survey-responses" },
  { key: "survey-feedback" },

  // ==================== NOTIFICATIONS ====================
  { key: "notifications" },

  // ==================== SYSTEM ====================
  { key: "logs" },
] as const satisfies readonly ResourceConfig[];

/**
 * Union of all resource keys.
 */
export type Resource = (typeof RESOURCES)[number]["key"];

/**
 * Plain list of resource keys (without their approval-action config).
 */
export const RESOURCE_KEYS = RESOURCES.map((r) => r.key) as Resource[];
