export const PARAMETER_SERVICE_TYPES = ["utama", "tambahan"] as const;
export type ParameterServiceType = (typeof PARAMETER_SERVICE_TYPES)[number];

export const PARAMETER_SERVICE_TYPE_LABELS: Record<
  ParameterServiceType,
  string
> = {
  utama: "Layanan Utama",
  tambahan: "Layanan Tambahan",
};

export const PARAMETER_SERVICE_TYPE_COLORS: Record<
  ParameterServiceType,
  string
> = {
  utama: "bg-blue-100 text-blue-700",
  tambahan: "bg-orange-100 text-orange-700",
};
