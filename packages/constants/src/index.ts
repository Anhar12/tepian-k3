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
