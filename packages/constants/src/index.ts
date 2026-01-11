export const PERMISSION_ACTION = [
  "create",
  "read",
  "update",
  "delete",
  "manage",
] as const;

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
