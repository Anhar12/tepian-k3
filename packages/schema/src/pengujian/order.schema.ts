import { ORDER_STATUS, WORKSHEET_STATUS } from "@tepian-k3/constants";
import { order } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "../platform/pagination.schema";

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
  // Filter by multiple statuses at once (e.g. role-locked views that span
  // several statuses). Applied with an IN clause alongside `status`.
  statuses: z.array(z.enum(ORDER_STATUS)).optional(),
  // Filter orders by the status of their associated worksheet (e.g. coordinator
  // views that should only surface orders whose worksheet is pending
  // verification). Applied as an EXISTS/IN subquery on the worksheets table.
  worksheetStatuses: z.array(z.enum(WORKSHEET_STATUS)).optional(),
  search: z.string().default(""),
});

const createArrivalDepartureDateSchema = z
  .object({
    orderId: z.uuidv7(),
    arrivalDate: z.iso.datetime(),
    departureDate: z.iso.datetime().optional(),
  })
  .refine(
    (data) => {
      // If keberangkatan is filled, kedatangan MUST be filled
      if (data.departureDate && !data.arrivalDate) {
        return false;
      }
      return true;
    },
    {
      message: "Tanggal kedatangan harus diisi terlebih dahulu",
      path: ["arrivalDate"], // Error shows on kedatangan field
    },
  )
  .refine(
    (data) => {
      // If both exist, keberangkatan must be >= kedatangan
      if (data.arrivalDate && data.departureDate) {
        return new Date(data.departureDate) >= new Date(data.arrivalDate);
      }
      return true;
    },
    {
      message:
        "Tanggal keberangkatan harus setelah atau sama dengan tanggal kedatangan",
      path: ["departureDate"],
    },
  );

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
  createArrivalDepartureDateSchema,
};

export default orderSchema;
