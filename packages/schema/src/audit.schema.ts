import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@tepian-k3/constants";
import { z } from "zod";

// Audit action enum
export const auditActionSchema = z.enum(AUDIT_ACTIONS);

// Entity type enum
export const auditEntityTypeSchema = z.enum(AUDIT_ENTITY_TYPES);

// Get audit logs filters
export const getAuditLogsSchema = z.object({
  entityType: auditEntityTypeSchema.optional(),
  entityId: z.string().optional(),
  action: auditActionSchema.optional(),
  userId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().min(1).max(500).default(100),
  page: z.number().min(1).default(1),
});

// Get entity audit history
export const getEntityAuditHistorySchema = z.object({
  entityType: auditEntityTypeSchema,
  entityId: z.string(),
});

// Get user activity
export const getUserActivitySchema = z.object({
  userId: z.string(),
  limit: z.number().min(1).max(500).default(100),
});

// Get audit statistics
export const getAuditStatisticsSchema = z.object({
  entityType: auditEntityTypeSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const auditSchema = {
  auditActionSchema,
  auditEntityTypeSchema,
  getAuditLogsSchema,
  getEntityAuditHistorySchema,
  getUserActivitySchema,
  getAuditStatisticsSchema,
};

export default auditSchema;
