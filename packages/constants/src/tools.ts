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

export const BAHAN_UNITS = ["gram", "kg", "botol", "ml", "liter"] as const;

export type BahanUnit = (typeof BAHAN_UNITS)[number];

export const BAHAN_UNIT_LABELS: Record<BahanUnit, string> = {
  gram: "Gram",
  kg: "Kilogram",
  botol: "Botol",
  ml: "Mililiter",
  liter: "Liter",
};

export const BAHAN_STATUS = [
  "tersedia",
  "hampir_habis",
  "habis",
  "expired",
  "dipesan",
] as const;

export type BahanStatus = (typeof BAHAN_STATUS)[number];

export const BAHAN_STATUS_LABELS: Record<BahanStatus, string> = {
  tersedia: "Tersedia",
  hampir_habis: "Hampir Habis",
  habis: "Habis",
  expired: "Expired",
  dipesan: "Dipesan",
};

export const BAHAN_STATUS_COLORS: Record<BahanStatus, string> = {
  tersedia: "bg-green-100 text-green-700",
  hampir_habis: "bg-yellow-100 text-yellow-700",
  habis: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
  dipesan: "bg-blue-100 text-blue-700",
};
