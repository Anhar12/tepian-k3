import { z } from "zod";

export const approvePelatihanOrderSchema = z.object({
  orderId: z.string().uuid("ID order tidak valid"),
});

export const rejectPelatihanOrderApprovalSchema = z.object({
  orderId: z.string().uuid("ID order tidak valid"),
  reason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
});

export const rejectPelatihanPaymentSchema = z.object({
  orderId: z.string().uuid("ID order tidak valid"),
  reason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
});

export const pelatihanOrderSchema = {
  approvePelatihanOrderSchema,
  rejectPelatihanOrderApprovalSchema,
  rejectPelatihanPaymentSchema,
};

export default pelatihanOrderSchema;
