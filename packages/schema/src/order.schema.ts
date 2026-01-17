import { ORDER_STATUS } from "@tepian-k3/constants";
import { order } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

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

const getAllOrdersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(ORDER_STATUS).optional(),
  search: z.string().optional(),
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
