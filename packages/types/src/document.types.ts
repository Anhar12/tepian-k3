import type {
  DocumentEntityType,
  DocumentStatus,
  DocumentType,
} from "@tepian-k3/constants";
import type { documents, documentVerifications } from "@tepian-k3/db/schema";

// Inferred types from Drizzle schema
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentVerification = typeof documentVerifications.$inferSelect;
export type NewDocumentVerification = typeof documentVerifications.$inferInsert;

// Create document input
export type CreateDocumentInput = {
  documentNumber: string;
  type: DocumentType;
  title: string;
  description?: string;
  entityType: DocumentEntityType;
  entityId: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedByUserId: string;
};

// Sign document input
export type SignDocumentInput = {
  signatureData: string;
  verificationToken: string;
  verificationUrl: string;
  qrCodeUrl: string;
  signedByUserId: string;
};

// Verify document input
export type VerifyDocumentInput = {
  verifiedByUserId?: string;
  verifiedByIp?: string;
  verifiedByUserAgent?: string;
  verificationLocation?: string;
  verificationMethod?: "qr_scan" | "token" | "manual";
  isValid: boolean;
  verificationNotes?: string;
};

// Document with relations
export type DocumentWithRelations = Document & {
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
  signedBy?: {
    id: string;
    name: string;
    email: string;
  };
  verifications?: DocumentVerification[];
};

// Verification result
export type VerificationResult = {
  isValid: boolean;
  reason: string | null;
  document: Document | null;
};

// Document filters
export type DocumentFilters = {
  entityType?: DocumentEntityType;
  entityId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  uploadedByUserId?: string;
  signedByUserId?: string;
};
