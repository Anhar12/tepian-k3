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
