export type DataTableConfig = typeof dataTableConfig;

export const dataTableConfig = {
  textOperators: [
    { label: "Mengandung kata", value: "iLike" as const },
    { label: "Tidak mengandung kata", value: "notILike" as const },
    { label: "Sama dengan", value: "eq" as const },
    { label: "Tidak sama dengan", value: "ne" as const },
    { label: "Kosong", value: "isEmpty" as const },
    { label: "Tidak kosong", value: "isNotEmpty" as const },
  ],
  numericOperators: [
    { label: "Sama dengan", value: "eq" as const },
    { label: "Tidak sama dengan", value: "ne" as const },
    { label: "Kurang dari", value: "lt" as const },
    { label: "Kurang dari atau sama dengan", value: "lte" as const },
    { label: "Lebih dari", value: "gt" as const },
    { label: "Lebih dari atau sama dengan", value: "gte" as const },
    { label: "Di antara", value: "isBetween" as const },
    { label: "Kosong", value: "isEmpty" as const },
    { label: "Tidak kosong", value: "isNotEmpty" as const },
  ],
  dateOperators: [
    { label: "Sama dengan", value: "eq" as const },
    { label: "Tidak sama dengan", value: "ne" as const },
    { label: "Sebelum", value: "lt" as const },
    { label: "Sesudah", value: "gt" as const },
    { label: "Pada atau sebelum", value: "lte" as const },
    { label: "Pada atau sesudah", value: "gte" as const },
    { label: "Di antara", value: "isBetween" as const },
    { label: "Relatif dari hari ini", value: "isRelativeToToday" as const },
    { label: "Kosong", value: "isEmpty" as const },
    { label: "Tidak kosong", value: "isNotEmpty" as const },
  ],
  selectOperators: [
    { label: "Sama dengan", value: "eq" as const },
    { label: "Tidak sama dengan", value: "ne" as const },
    { label: "Kosong", value: "isEmpty" as const },
    { label: "Tidak kosong", value: "isNotEmpty" as const },
  ],
  multiSelectOperators: [
    { label: "Memiliki salah satu", value: "inArray" as const },
    { label: "Tidak memiliki satupun", value: "notInArray" as const },
    { label: "Kosong", value: "isEmpty" as const },
    { label: "Tidak kosong", value: "isNotEmpty" as const },
  ],
  booleanOperators: [
    { label: "Sama dengan", value: "eq" as const },
    { label: "Tidak sama dengan", value: "ne" as const },
  ],
  sortOrders: [
    { label: "Urutan A-Z / Naik", value: "asc" as const },
    { label: "Urutan Z-A / Turun", value: "desc" as const },
  ],
  filterVariants: [
    "text",
    "number",
    "range",
    "date",
    "dateRange",
    "boolean",
    "select",
    "multiSelect",
  ] as const,
  operators: [
    "iLike",
    "notILike",
    "eq",
    "ne",
    "inArray",
    "notInArray",
    "isEmpty",
    "isNotEmpty",
    "lt",
    "lte",
    "gt",
    "gte",
    "isBetween",
    "isRelativeToToday",
  ] as const,
  joinOperators: ["and", "or"] as const,
};

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface FilterItemSchema {
  id: string;
  value: string | string[];
  variant: FilterVariant;
  operator: FilterOperator;
  filterId: string;
}
