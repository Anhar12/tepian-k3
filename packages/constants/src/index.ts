// Re-export permission action from permissions module to avoid circular imports
export { PERMISSION_ACTION, type PermissionAction } from "./permissions";

export const USER_STATUS = ["Active", "Inactive", "Banned"] as const;

export const TOOLS_CONDITIONS = [
  "baik",
  "rusak",
  "diperingatkan",
  "tidak_menyala",
] as const;

export type ToolsCondition = (typeof TOOLS_CONDITIONS)[number];

export const TOOLS_CONDITIONS_LABELS: Record<ToolsCondition, string> = {
  baik: "Baik",
  rusak: "Rusak",
  diperingatkan: "Diperingatkan",
  tidak_menyala: "Tidak Menyala",
};

export const TOOLS_CONDITIONS_COLORS: Record<ToolsCondition, string> = {
  baik: "bg-green-100 text-green-700",
  rusak: "bg-red-100 text-red-700",
  diperingatkan: "bg-yellow-100 text-yellow-700",
  tidak_menyala: "bg-gray-100 text-gray-700",
};

export const TOOLS_AVAILABILITY = [
  "ready",
  "kalibrasi",
  "not_ready",
  "maintenance",
  "dipinjam",
] as const;

export type ToolsAvailability = (typeof TOOLS_AVAILABILITY)[number];

export const TOOLS_AVAILABILITY_LABELS: Record<ToolsAvailability, string> = {
  ready: "Ready",
  kalibrasi: "Kalibrasi",
  not_ready: "Not Ready",
  maintenance: "Maintenance",
  dipinjam: "Dipinjam",
};

export const TOOLS_AVAILABILITY_COLORS: Record<ToolsAvailability, string> = {
  ready: "bg-green-100 text-green-700",
  kalibrasi: "bg-yellow-100 text-yellow-700",
  not_ready: "bg-red-100 text-red-700",
  maintenance: "bg-orange-100 text-orange-700",
  dipinjam: "bg-blue-100 text-blue-700",
};

export const ORDER_STATUS = [
  "pending",
  "confirmed",
  "revision",
  "rejected",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  revision: "Revision",
  rejected: "Rejected",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  revision: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
];

export const ORDER_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type OrderApprovalStatus = (typeof ORDER_APPROVAL_STATUSES)[number];

export const ORDER_APPROVAL_STATUS_LABELS: Record<OrderApprovalStatus, string> =
  {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };

export const ORDER_PAYMENT_STATUSES = [
  "unpaid",
  "pending_verification",
  "paid",
  "rejected",
] as const;

export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  unpaid: "Unpaid",
  pending_verification: "Pending Verification",
  paid: "Paid",
  rejected: "Rejected",
};

export const TESTING_SEQUENCE_NAME = "testing_number_seq";

export const ORDER_SEQUENCE_NAME = "order_number_seq";

export const TESTING_STATUSES = [
  "start_testing",
  "sample_submission",
  "sample_analysis",
  "report_generation",
  "report_publishing",
  "completed",
] as const;

export type TestingStatus = (typeof TESTING_STATUSES)[number];

export const TESTING_STATUS_LABELS: Record<TestingStatus, string> = {
  start_testing: "Start Testing",
  sample_submission: "Sample Submission",
  sample_analysis: "Sample Analysis",
  report_generation: "Report Generation",
  report_publishing: "Report Publishing",
  completed: "Completed",
};

export const REDIS_CHANNEL = "tepian-k3-events";

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "status_change",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
  status_change: "Status Change",
};

export const DOCUMENT_ENTITY_TYPES = [
  "order",
  "testing",
  "user_company",
  "user", // for profile documents, certifications, etc.
] as const;

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export const DOCUMENT_ENTITY_TYPE_LABELS: Record<string, string> = {
  order: "Order",
  testing: "Testing",
  user_company: "User Company",
  user: "User",
};

export const DOCUMENT_TYPES = [
  // Order documents
  "offering_document",
  "offering_user_document",
  "invoice",
  "proof_of_payment",
  "assignment_letter",

  // Testing documents
  "testing_report",
  "lab_certificate",
  "sample_analysis",
  "calibration_certificate",

  // Company documents
  "business_license",
  "company_registration",

  // User documents
  "id_card",
  "certification",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  // Order documents
  offering_document: "Offering Document",
  offering_user_document: "Offering User Document",
  invoice: "Invoice",
  proof_of_payment: "Proof of Payment",
  assignment_letter: "Assignment Letter",

  // Testing documents
  testing_report: "Testing Report",
  lab_certificate: "Lab Certificate",
  sample_analysis: "Sample Analysis",
  calibration_certificate: "Calibration Certificate",

  // Company documents
  business_license: "Business License",
  company_registration: "Company Registration",

  // User documents
  id_card: "ID Card",
  certification: "Certification",
};

export const DOCUMENT_STATUS = [
  "draft",
  "pending_signature",
  "signed",
  "verified",
  "rejected",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[number];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  pending_signature: "Pending Signature",
  signed: "Signed",
  verified: "Verified",
  rejected: "Rejected",
};

export const EMPLOYEE_STATUS = ["siap", "spt", "standby", "cuti"] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[number];

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  siap: "Siap",
  spt: "SPT",
  standby: "Standby",
  cuti: "Cuti",
};

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  siap: "bg-green-100 text-green-700",
  spt: "bg-blue-100 text-blue-700",
  standby: "bg-yellow-100 text-yellow-700",
  cuti: "bg-gray-100 text-gray-700",
};

export const WORKSHEET_STATUS = [
  "draft",
  "in_progress",
  "completed",
  "approved",
  "rejected",
] as const;

export type WorksheetStatus = (typeof WORKSHEET_STATUS)[number];

export const WORKSHEET_STATUS_LABELS: Record<WorksheetStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  approved: "Approved",
  rejected: "Rejected",
};

export const WORKSHEET_NOTE_STATUS = [
  "info",
  "warning",
  "danger",
  "success",
  "important",
  "question",
  "urgent",
  "unknown",
] as const;

export type WorksheetNoteStatus = (typeof WORKSHEET_NOTE_STATUS)[number];

export const WORKSHEET_NOTE_STATUS_LABELS: Record<WorksheetNoteStatus, string> =
  {
    info: "Info",
    warning: "Warning",
    danger: "Danger",
    success: "Success",
    important: "Important",
    question: "Question",
    urgent: "Urgent",
    unknown: "Unknown",
  };

export const WORKSHEET_NOTE_STATUS_COLORS: Record<WorksheetNoteStatus, string> =
  {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    success: "bg-green-100 text-green-700",
    important: "bg-purple-100 text-purple-700",
    question: "bg-indigo-100 text-indigo-700",
    urgent: "bg-pink-100 text-pink-700",
    unknown: "bg-gray-100 text-gray-700",
  };

export const NOTIFICATION_TYPES = [
  "order_status_changed",
  "payment_received",
  "payment_rejected",
  "testing_started",
  "testing_completed",
  "document_ready",
  "document_signed",
  "assignment_received",
  "system_announcement",
  "general",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_status_changed: "Order Status Changed",
  payment_received: "Payment Received",
  payment_rejected: "Payment Rejected",
  testing_started: "Testing Started",
  testing_completed: "Testing Completed",
  document_ready: "Document Ready",
  document_signed: "Document Signed",
  assignment_received: "Assignment Received",
  system_announcement: "System Announcement",
  general: "General Notification",
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  order_status_changed: "bg-blue-100 text-blue-700",
  payment_received: "bg-green-100 text-green-700",
  payment_rejected: "bg-red-100 text-red-700",
  testing_started: "bg-purple-100 text-purple-700",
  testing_completed: "bg-green-100 text-green-700",
  document_ready: "bg-indigo-100 text-indigo-700",
  document_signed: "bg-teal-100 text-teal-700",
  assignment_received: "bg-orange-100 text-orange-700",
  system_announcement: "bg-yellow-100 text-yellow-700",
  general: "bg-gray-100 text-gray-700",
};

// Re-export resources, permissions, and roles
export * from "./resources";
export * from "./permissions";
export * from "./roles";
export * from "./rate-limits";
