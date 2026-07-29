import { z } from "zod";

export const getAuditTrailSchema = z.object({
  orderId: z.string().uuid(),
});

export const exportSingleAuditTrailSchema = z.object({
  orderId: z.string().uuid(),
  includeZipDocs: z.boolean().optional().default(false),
});

export const exportBulkAuditTrailSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1),
});

const auditTrailSchema = {
  getAuditTrailSchema,
  exportSingleAuditTrailSchema,
  exportBulkAuditTrailSchema,
};

export default auditTrailSchema;
