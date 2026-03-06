import { audits } from "@tepian-k3/db/schema";

export type Audit = typeof audits.$inferSelect;

export type InsertAudit = typeof audits.$inferInsert;

export type AuditAction = "create" | "update" | "delete" | "status_change";

export type AuditEntityType =
  | "order"
  | "order_item"
  | "order_status_history"
  | "testing"
  | "testing_item"
  | "user"
  | "user_company"
  | "parameter"
  | "tool"
  | "worksheet"
  | "worksheet_item"
  | "worksheet_assignment"
  | "worksheet_tool"
  | "worksheet_note"
  | "chemical_material";

export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogOptions {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: AuditMetadata;
  description?: string;
}

export interface AuditDiff {
  changed: boolean;
  fields: FieldChange[];
  addedFields: string[];
  removedFields: string[];
}
