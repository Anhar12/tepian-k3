export const PERMISSION_ACTION = [
  "create",
  "read",
  "update",
  "delete",
  "manage",
] as const;

export const USER_STATUS = ["Active", "Inactive", "Banned"] as const;

export const TOOLS_CONDITIONS = [
  "Baik",
  "Rusak",
  "Diperingatkan",
  "Tidak Menyala",
] as const;

export type ToolsCondition = (typeof TOOLS_CONDITIONS)[number];

export const TOOLS_AVAILABILITY = [
  "Ready",
  "Kalibrasi",
  "Not Ready",
  "Maintenance",
  "Dipinjam",
] as const;

export type ToolsAvailability = (typeof TOOLS_AVAILABILITY)[number];

export const ORDER_STATUS = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export const TESTING_SEQUENCE_NAME = "testing_number_seq";

export const ORDER_SEQUENCE_NAME = "order_number_seq";
