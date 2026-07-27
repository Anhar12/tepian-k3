export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "status_change",
  "read",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
  status_change: "Status Change",
  read: "Read",
};

export const AUDIT_ENTITY_TYPES = [
  "order",
  "order_item",
  "order_status_history",
  "testing",
  "testing_item",
  "user",
  "user_company",
  "parameter",
  "tool",
  "worksheet",
  "worksheet_item",
  "worksheet_assignment",
  "worksheet_tool",
  "worksheet_note",
  "chemical_material",
  "faq",
  "setting",
  "ppid_documents",
  "ppid_submissions",
  "position",
  "employee",
  "employee_certification",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  order: "Order",
  order_item: "Order Item",
  order_status_history: "Order Status History",
  testing: "Testing",
  testing_item: "Testing Item",
  user: "User",
  user_company: "User Company",
  parameter: "Parameter",
  tool: "Tool",
  worksheet: "Worksheet",
  worksheet_item: "Worksheet Item",
  worksheet_assignment: "Worksheet Assignment",
  worksheet_tool: "Worksheet Tool",
  worksheet_note: "Worksheet Note",
  chemical_material: "Bahan Kimia",
  faq: "FAQ",
  setting: "Pengaturan Landing Page",
  ppid_documents: "Dokumen PPID",
  ppid_submissions: "Permohonan PPID",
  position: "Jabatan",
  employee: "Pegawai",
  employee_certification: "Sertifikasi Pegawai",
};
