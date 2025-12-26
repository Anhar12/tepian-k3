export const PERMISSION_ACTION = [
  "create",
  "read",
  "update",
  "delete",
  "manage",
] as const;

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
