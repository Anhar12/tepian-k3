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

const orderSchema = {
  createOrderSchema,
  rejectApproveOrderSchema,
  rejectPaymentOrderSchema,
  uploadOfferingDocumentSchema,
  uploadOfferingUserDocumentSchema,
  uploadInvoiceSchema,
  uploadProofOfPaymentSchema,
  uploadAssignmentLetterSchema,
};

export default orderSchema;
