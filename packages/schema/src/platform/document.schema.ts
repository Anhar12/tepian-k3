import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { documents, documentVerifications } from "@tepian-k3/db/schema";
import {
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
} from "@tepian-k3/constants";
import { createPaginationSchema } from "./pagination.schema";

// Base schemas from Drizzle
export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);
export const insertDocumentVerificationSchema = createInsertSchema(
  documentVerifications,
);
export const selectDocumentVerificationSchema = createSelectSchema(
  documentVerifications,
);

// Document entity types
export const documentEntityTypeSchema = z.enum(DOCUMENT_ENTITY_TYPES);

// Document types
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

// Document status
export const documentStatusSchema = z.enum(DOCUMENT_STATUS);

export const createDocumentSchema = z.object({
  documentNumber: z.string().min(1).max(100),
  type: documentTypeSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  entityType: documentEntityTypeSchema,
  entityId: z.uuidv7(),
  fileUrl: z.url(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(100).optional(),
  uploadedByUserId: z.uuidv7(),
});

// Sign document schema
export const signDocumentSchema = z.object({
  documentId: z.uuidv7(),
  signatureData: z.string().min(1),
  verificationToken: z.string().min(1).max(255),
  verificationUrl: z.url(),
  qrCodeUrl: z.url(),
  signedByUserId: z.uuidv7(),
});

// Verify document schema
export const verifyDocumentSchema = z.object({
  token: z.string().min(1),
  verifiedByUserId: z.uuidv7().optional(),
  verifiedByIp: z.string().max(45).optional(),
  verifiedByUserAgent: z.string().optional(),
  verificationLocation: z.string().optional(),
  verificationMethod: z.enum(["qr_scan", "token", "manual"]).optional(),
});

// Update document status schema
export const updateDocumentStatusSchema = z.object({
  documentId: z.uuidv7(),
  status: documentStatusSchema,
});

// Get documents by entity schema
export const getDocumentsByEntitySchema = z.object({
  entityType: documentEntityTypeSchema,
  entityId: z.uuidv7(),
});

// Get document by type and entity schema
export const getDocumentByTypeAndEntitySchema = z.object({
  entityType: documentEntityTypeSchema,
  entityId: z.uuidv7(),
  documentType: documentTypeSchema,
});

// Document filters schema
export const documentFiltersSchema = z.object({
  entityType: documentEntityTypeSchema.optional(),
  entityId: z.uuidv7().optional(),
  type: documentTypeSchema.optional(),
  status: documentStatusSchema.optional(),
  uploadedByUserId: z.uuidv7().optional(),
  signedByUserId: z.uuidv7().optional(),
});

// Upload document schema (for file uploads)
export const uploadDocumentSchema = z.object({
  entityType: documentEntityTypeSchema,
  entityId: z.uuidv7(),
  type: documentTypeSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  file: z.file(),
});

// Verification history schema
export const getVerificationHistorySchema = z.object({
  documentId: z.uuidv7(),
});

// Paginated Assigment Document schema
export const SORTABLE_ASSIGNMENT_DOCUMENT_FIELDS = [
  "title",
  "status",
  "createdAt",
  "updatedAt",
] as const satisfies readonly (keyof typeof documents.$inferSelect)[];

const getMyAssignmentDocumentsSchema = createPaginationSchema(
  SORTABLE_ASSIGNMENT_DOCUMENT_FIELDS,
).extend({
  title: z.string().default(""),
  status: documentStatusSchema.optional(),
});

const createSPTDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  title: z.string().min(1).max(255),
  file: z
    .file()
    .max(10 * 1024 * 1024)
    .mime(["application/pdf"]),
});

const documentSchema = {
  // Base schemas
  insertDocumentSchema,
  selectDocumentSchema,
  insertDocumentVerificationSchema,
  selectDocumentVerificationSchema,

  // Enum schemas
  documentEntityTypeSchema,
  documentTypeSchema,
  documentStatusSchema,

  // Operation schemas
  createDocumentSchema,
  signDocumentSchema,
  verifyDocumentSchema,
  updateDocumentStatusSchema,
  getDocumentsByEntitySchema,
  getDocumentByTypeAndEntitySchema,
  documentFiltersSchema,
  uploadDocumentSchema,
  getVerificationHistorySchema,

  // SPT Document schema
  createSPTDocumentSchema,

  // Paginated schemas
  getMyAssignmentDocumentsSchema,
};

export default documentSchema;
