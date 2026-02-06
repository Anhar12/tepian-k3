import { ORDER_STATUS } from "@tepian-k3/constants";
import { order } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

const createOrderSchema = createInsertSchema(order, {
  companyId: z.uuidv7(),
}).pick({
  companyId: true,
});

const rejectApproveOrderSchema = z.object({
  reason: z.string().min(1).max(500),
});

const rejectPaymentOrderSchema = z.object({
  reason: z.string().min(1).max(500),
});

const uploadOfferingDocumentSchema = z.object({
  offeringDocument: z.file().max(5 * 1024 * 1024),
});

const uploadOfferingUserDocumentSchema = z.object({
  offeringUserDocument: z.file().max(5 * 1024 * 1024),
});

const uploadInvoiceSchema = z.object({
  invoice: z.file().max(5 * 1024 * 1024),
});

const uploadProofOfPaymentSchema = z.object({
  proofOfPayment: z.file().max(5 * 1024 * 1024),
});

const uploadAssignmentLetterSchema = z.object({
  assignmentLetter: z.file().max(5 * 1024 * 1024),
});

const SORTABLE_ORDER_FIELDS = [
  "createdAt",
  "orderNumber",
  "status",
  "totalAmount",
  "updatedAt",
] as const satisfies readonly (keyof typeof order.$inferSelect)[];

const getAllOrdersSchema = createPaginationSchema(SORTABLE_ORDER_FIELDS, {
  id: "createdAt",
  desc: true,
}).extend({
  status: z.enum(ORDER_STATUS).optional(),
  search: z.string().default(""),
});

const orderSchema = {
  createOrderSchema,
  rejectApproveOrderSchema,
  rejectPaymentOrderSchema,
  uploadOfferingDocumentSchema,
  uploadOfferingUserDocumentSchema,
  uploadInvoiceSchema,
  uploadProofOfPaymentSchema,
  uploadAssignmentLetterSchema,
  getAllOrdersSchema,
};

export default orderSchema;
