import { Effect } from "effect";
import { db, type DBorTx } from "@tepian-k3/db/client";
import {
  documents,
  documentSignatures,
  documentVerifications,
  employees,
  worksheetAssignments,
  worksheets,
} from "@tepian-k3/db/schema";
import { eq, and, desc, inArray, ilike, count } from "@tepian-k3/db";
import { TRPCError } from "@trpc/server";
import type {
  CreateDocumentInput,
  SignDocumentInput,
  VerifyDocumentInput,
} from "@tepian-k3/types/platform/document.types";
import type {
  DocumentEntityType,
  DocumentStatus,
  DocumentType,
} from "@tepian-k3/constants";
import { logError } from "@tepian-k3/services/logger";
import { storageService } from "@tepian-k3/services/storage";
import { documentSigningService } from "@tepian-k3/services/document-signing";
import QRCode from "qrcode";
import type { z } from "zod";
import documentSchema from "@tepian-k3/schema/platform/document.schema";

const documentQueries = {
  /**
   * Get all documents for a specific entity (order, testing, etc.)
   */
  getDocumentsByEntity: (entityType: DocumentEntityType, entityId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.documents.findMany({
          where: and(
            eq(documents.entityType, entityType),
            eq(documents.entityId, entityId),
          ),
          orderBy: desc(documents.createdAt),
        }),
      catch: (error) => {
        logError(
          "documentQueries.getDocumentsByEntity",
          "Error fetching documents by entity",
          { entityType, entityId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil dokumen",
          cause: error,
        });
      },
    }),

  /**
   * Get documents by type for an entity
   */
  getDocumentByTypeAndEntity: (
    entityType: DocumentEntityType,
    entityId: string,
    documentType: DocumentType,
  ) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          db.query.documents.findFirst({
            where: and(
              eq(documents.entityType, entityType),
              eq(documents.entityId, entityId),
              eq(documents.type, documentType),
            ),
          }),
        catch: (error) => {
          logError(
            "documentQueries.getDocumentByTypeAndEntity",
            "Error fetching document by type and entity",
            { entityType, entityId, documentType, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil dokumen",
            cause: error,
          });
        },
      });

      return results || null;
    }),

  /**
   * Get document by ID
   */
  getDocumentById: (documentId: string) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          db.query.documents.findFirst({
            where: eq(documents.id, documentId),
          }),

        catch: (error) => {
          logError(
            "documentQueries.getDocumentById",
            "Error fetching document by ID",
            { documentId, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil dokumen",
            cause: error,
          });
        },
      });

      if (!results) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Dokumen tidak ditemukan",
          }),
        );
      }

      return results;
    }),

  /**
   * Create a new document
   */
  createDocument: (input: CreateDocumentInput, tx: DBorTx = db) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          tx
            .insert(documents)
            .values({
              documentNumber: input.documentNumber,
              type: input.type,
              title: input.title,
              description: input.description,
              entityType: input.entityType,
              entityId: input.entityId,
              fileUrl: input.fileUrl,
              fileName: input.fileName,
              fileSize: input.fileSize,
              mimeType: input.mimeType,
              uploadedByUserId: input.uploadedByUserId,
              verificationToken: input.verificationToken,
              signatureData: input.signatureData,
              signedByUserId: input.signedByUserId,
              signedAt: input.signedAt,
              status: input.status || "draft",
            })
            .returning(),
        catch: (error) => {
          logError(
            "documentQueries.createDocument",
            "Error creating document",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat dokumen",
            cause: error,
          });
        },
      });

      const document = results[0];

      if (!document) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat dokumen",
          }),
        );
      }

      return document;
    }),

  /**
   * Update document signed status
   */
  updateDocumentSignedStatus: (
    documentId: string,
    data: {
      status: "signed";
      signatureData: string;
      verificationToken: string;
      verificationUrl: string;
      qrCodeUrl: string;
      signedByUserId: string;
      signedAt: string;
    },
    tx: DBorTx = db,
  ) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(documents)
            .set(data)
            .where(eq(documents.id, documentId))
            .returning(),
        catch: (error) => {
          logError(
            "documentQueries.updateDocumentSignedStatus",
            "Error updating document",
            { documentId, data, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menyimpan data TTE",
            cause: error,
          });
        },
      });
      return results[0];
    }),

  /**
   * Sign a document with JWT and generate QR code
   */
  signDocumentWithJWT: (
    documentId: string,
    signedByUserId: string,
    appUrl: string,
  ) =>
    Effect.gen(function* () {
      // Get the document
      const document = yield* documentQueries.getDocumentById(documentId);

      // Download file content for hashing
      const fileContent = yield* storageService.download(document.fileUrl);

      // Create signature using JWT
      const signatureData =
        yield* documentSigningService.createDocumentSignature(
          document.id,
          document.documentNumber,
          document.entityType,
          document.entityId,
          document.type,
          document.fileUrl,
          fileContent,
          signedByUserId,
        );

      // Generate verification URL
      const verificationUrl = `${appUrl}/verify/${signatureData.verificationToken}`;

      // Generate QR code
      const qrCodeDataUrl = yield* Effect.tryPromise({
        try: () =>
          QRCode.toDataURL(verificationUrl, {
            width: 400,
            margin: 2,
            errorCorrectionLevel: "H", // High error correction for documents
          }),
        catch: (error) => {
          logError(
            "documentQueries.signDocumentWithJWT",
            "Error generating QR code",
            { documentId, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat kode QR",
            cause: error,
          });
        },
      });

      const splitDataUrl = qrCodeDataUrl.split(",")[1];

      if (splitDataUrl === undefined) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat kode QR",
          }),
        );
      }

      // Upload QR code image
      const qrBuffer = Buffer.from(splitDataUrl, "base64");
      const qrFile = yield* storageService.upload(qrBuffer, {
        filename: `qr-${signatureData.verificationToken}.png`,
        folder: "qr-codes",
      });

      // Update document with signature
      const results = yield* Effect.tryPromise({
        try: () =>
          db
            .update(documents)
            .set({
              status: "signed",
              signatureData: signatureData.signatureData, // JWT signature
              verificationToken: signatureData.verificationToken,
              verificationUrl,
              qrCodeUrl: qrFile.key,
              signedByUserId,
              signedAt: new Date().toISOString(),
            })
            .where(eq(documents.id, documentId))
            .returning(),
        catch: (error) => {
          logError(
            "documentQueries.signDocumentWithJWT",
            "Error updating document with signature",
            { documentId, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui dokumen",
            cause: error,
          });
        },
      });

      const signedDocument = results[0];

      if (!signedDocument) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update document",
          }),
        );
      }

      return signedDocument;
    }),

  /**
   * Sign a document and generate verification token
   */
  signDocument: (documentId: string, input: SignDocumentInput) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          db
            .update(documents)
            .set({
              status: "signed",
              signatureData: input.signatureData,
              verificationToken: input.verificationToken,
              verificationUrl: input.verificationUrl,
              qrCodeUrl: input.qrCodeUrl,
              signedByUserId: input.signedByUserId,
              signedAt: new Date().toISOString(),
            })
            .where(eq(documents.id, documentId))
            .returning(),
        catch: (error) => {
          logError("documentQueries.signDocument", "Error signing document", {
            documentId,
            input,
            error,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menandatangani dokumen",
            cause: error,
          });
        },
      });

      const document = results[0];

      if (!document) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Dokumen tidak ditemukan",
          }),
        );
      }

      return document;
    }),

  /**
   * Get document by verification token
   */
  getDocumentByToken: (token: string) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          db.query.documents.findFirst({
            where: eq(documents.verificationToken, token),
          }),

        catch: (error) => {
          logError(
            "documentQueries.getDocumentByToken",
            "Error fetching document by token",
            {
              token,
              error,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil dokumen",
            cause: error,
          });
        },
      });

      return results || null;
    }),

  /**
   * Verify document by token (for QR code scanning)
   */
  verifyDocumentByToken: (
    token: string,
    metadata: {
      verifiedByUserId?: string;
      verifiedByIp?: string;
      verifiedByUserAgent?: string;
      checkFileIntegrity?: boolean;
    },
  ) =>
    Effect.gen(function* () {
      // Get document by verification token
      let results = yield* Effect.tryPromise({
        try: () =>
          db.query.documents.findFirst({
            where: eq(documents.verificationToken, token),
            with: {
              signedBy: true,
            },
          }),

        catch: (error) => {
          logError(
            "documentQueries.verifyDocumentByToken",
            "Error fetching document by token",
            { token, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch document",
            cause: error,
          });
        },
      });

      // Fallback: search in documentSignatures table if not found directly in documents
      if (!results) {
        const sigRecord = yield* Effect.tryPromise({
          try: () =>
            db.query.documentSignatures.findFirst({
              where: eq(documentSignatures.verificationToken, token),
              with: {
                document: {
                  with: {
                    signedBy: true,
                  },
                },
                signedBy: true,
              },
            }),
          catch: (error) => {
            logError(
              "documentQueries.verifyDocumentByToken",
              "Error fetching signature by token",
              { token, error },
            );
            return null;
          },
        });

        if (sigRecord && sigRecord.document) {
          results = {
            ...sigRecord.document,
            signatureData: sigRecord.signatureData,
            verificationToken: sigRecord.verificationToken,
            signedBy: sigRecord.signedBy || sigRecord.document.signedBy,
          };
        }
      }

      if (!results) {
        return {
          valid: false,
          error: "Document not found",
          document: null,
        };
      }

      if (!results.signatureData) {
        yield* documentQueries.logVerification(results.id, {
          isValid: false,
          verificationNotes: "Document not signed",
          ...metadata,
        });

        return {
          valid: false,
          error: "Document has not been signed",
          document: null,
        };
      }

      // Verify JWT signature
      let fileContent: Buffer | undefined;
      if (metadata.checkFileIntegrity) {
        fileContent = yield* storageService.download(results.fileUrl);
      }

      const verificationResult =
        yield* documentSigningService.verifyDocumentAuthenticity(
          results.signatureData,
          fileContent,
        );

      if (!verificationResult.valid) {
        yield* documentQueries.logVerification(results.id, {
          isValid: false,
          verificationNotes: verificationResult.error || "Invalid signature",
          ...metadata,
        });

        return {
          valid: false,
          error: verificationResult.error,
          document: null,
        };
      }

      // Log successful verification
      yield* documentQueries.logVerification(results.id, {
        isValid: true,
        verificationNotes: "Document verified successfully",
        ...metadata,
      });

      // Update document verification timestamp
      yield* Effect.tryPromise({
        try: () =>
          db
            .update(documents)
            .set({
              status: "verified",
              verifiedAt: new Date().toISOString(),
            })
            .where(eq(documents.id, results.id)),
        catch: () => {
          // Non-critical error, don't fail verification
        },
      });

      return {
        valid: true,
        error: null,
        document: results,
        payload: verificationResult.payload,
      };
    }),

  /**
   * Verify a document and log the verification
   */
  verifyDocument: (token: string, metadata: VerifyDocumentInput) =>
    Effect.gen(function* () {
      const document = yield* documentQueries.getDocumentByToken(token);

      if (!document) {
        return {
          isValid: false,
          reason: "Dokumen tidak ditemukan",
          document: null,
        };
      }

      // Check expiration
      if (document.expiresAt && new Date(document.expiresAt) < new Date()) {
        yield* documentQueries.logVerification(document.id, {
          ...metadata,
          isValid: false,
          verificationNotes: "Verifikasi dokumen kedaluwarsa",
        });

        return {
          isValid: false,
          reason: "Verifikasi kedaluwarsa",
          document: null,
        };
      }

      // Log successful verification
      yield* documentQueries.logVerification(document.id, {
        ...metadata,
        isValid: true,
      });

      // Update document verified timestamp
      yield* Effect.tryPromise({
        try: () =>
          db
            .update(documents)
            .set({
              status: "verified",
              verifiedAt: new Date().toISOString(),
            })
            .where(eq(documents.id, document.id)),
        catch: (error) => {
          logError(
            "documentQueries.verifyDocument",
            "Error updating document verified status",
            { documentId: document.id, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui status verifikasi dokumen",
            cause: error,
          });
        },
      });

      return {
        isValid: true,
        reason: null,
        document,
      };
    }),

  /**
   * Log a verification attempt
   */
  logVerification: (
    documentId: string,
    input: {
      verifiedByUserId?: string;
      verifiedByIp?: string;
      verifiedByUserAgent?: string;
      verificationLocation?: string;
      isValid: boolean;
      verificationMethod?: string;
      verificationNotes?: string;
    },
  ) =>
    Effect.tryPromise({
      try: () =>
        db
          .insert(documentVerifications)
          .values({
            documentId,
            ...input,
            verificationMethod: input.verificationMethod || "qr_scan",
          })
          .returning(),
      catch: (error) => {
        logError(
          "documentQueries.logVerification",
          "Error logging document verification",
          { documentId, input, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mencatat verifikasi dokumen",
          cause: error,
        });
      },
    }),

  /**
   * Get verification history for a document
   */
  getVerificationHistory: (documentId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.documentVerifications.findMany({
          where: eq(documentVerifications.documentId, documentId),
          orderBy: desc(documentVerifications.createdAt),
        }),
      catch: (error) => {
        logError(
          "documentQueries.getVerificationHistory",
          "Error fetching document verification history",
          { documentId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil riwayat verifikasi dokumen",
          cause: error,
        });
      },
    }),

  /**
   * Update document status
   */
  updateDocumentStatus: (documentId: string, status: DocumentStatus) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          db
            .update(documents)
            .set({ status })
            .where(eq(documents.id, documentId))
            .returning(),
        catch: (error) => {
          logError(
            "documentQueries.updateDocumentStatus",
            "Error updating document status",
            { documentId, status, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui status dokumen",
            cause: error,
          });
        },
      });

      const document = results[0];

      if (!document) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Dokumen tidak ditemukan",
          }),
        );
      }

      return document;
    }),

  /**
   * Update document signature data
   * @param documentId - ID of the document to update
   * @param signatureData - New signature data
   * @returns
   */
  updateDocumentSignature: (
    documentId: string,
    signatureData: {
      signatureData: string;
      verificationToken: string;
    },
  ) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          db
            .update(documents)
            .set({
              signatureData: signatureData.signatureData,
              verificationToken: signatureData.verificationToken,
            })
            .where(eq(documents.id, documentId))
            .returning(),
        catch: (error) => {
          logError(
            "documentQueries.updateDocumentSignature",
            "Error updating document signature",
            { documentId, signatureData, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui tanda tangan dokumen",
            cause: error,
          });
        },
      });
      const document = results[0];

      if (!document) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Dokumen tidak ditemukan",
          }),
        );
      }

      return document;
    }),

  /**
   * Delete document
   */
  deleteDocument: (documentId: string) =>
    Effect.gen(function* () {
      const results = yield* Effect.tryPromise({
        try: () =>
          db.delete(documents).where(eq(documents.id, documentId)).returning(),
        catch: (error) => {
          logError(
            "documentQueries.deleteDocument",
            "Error deleting document",
            { documentId, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus dokumen",
            cause: error,
          });
        },
      });

      const document = results[0];

      if (!document) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Dokumen tidak ditemukan",
          }),
        );
      }

      return document;
    }),

  /**
   * Helper: Get all order documents
   */
  getOrderDocuments: (orderId: string) =>
    documentQueries.getDocumentsByEntity("order", orderId),

  /**
   * Helper: Get all testing documents
   */
  getTestingDocuments: (testingId: string) =>
    documentQueries.getDocumentsByEntity("testing", testingId),

  /**
   * Helper: Get specific order document (e.g., invoice)
   */
  getOrderInvoice: (orderId: string) =>
    documentQueries.getDocumentByTypeAndEntity("order", orderId, "invoice"),

  /**
   * Helper: Get testing report
   */
  getTestingReport: (testingId: string) =>
    documentQueries.getDocumentByTypeAndEntity(
      "testing",
      testingId,
      "testing_report",
    ),

  /**
   * Helper: Get lab certificate
   */
  getLabCertificate: (testingId: string) =>
    documentQueries.getDocumentByTypeAndEntity(
      "testing",
      testingId,
      "lab_certificate",
    ),

  /**
   * Create a document signature record
   */
  createDocumentSignature: (input: {
    documentId: string;
    signedByUserId: string;
    signerName: string;
    signerEmail?: string;
    purpose: string;
    signatureOrder?: number;
    qrCodePosition: {
      x: number;
      y: number;
      width: number;
      height: number;
      page: number;
    };
    verificationToken: string;
    verificationUrl: string;
    signatureData: string;
    fileHash: string;
    expiresAt?: string;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const [signature] = await db
          .insert(documentSignatures)
          .values({
            documentId: input.documentId,
            signedByUserId: input.signedByUserId,
            signerName: input.signerName,
            signerEmail: input.signerEmail,
            purpose: input.purpose,
            signatureOrder: input.signatureOrder,
            qrCodePosition: input.qrCodePosition,
            verificationToken: input.verificationToken,
            verificationUrl: input.verificationUrl,
            signatureData: input.signatureData,
            fileHash: input.fileHash,
            expiresAt: input.expiresAt,
          })
          .returning();

        return signature;
      },
      catch: (error) => {
        logError(
          "documentQueries.createDocumentSignature",
          "Error creating document signature",
          { input, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create document signature",
          cause: error,
        });
      },
    }),

  /**
   * Get all signatures for a document
   */
  getDocumentSignatures: (documentId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.documentSignatures.findMany({
          where: eq(documentSignatures.documentId, documentId),
          orderBy: [
            desc(documentSignatures.signatureOrder),
            desc(documentSignatures.createdAt),
          ],
          with: {
            signedBy: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "documentQueries.getDocumentSignatures",
          "Error fetching document signatures",
          { documentId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch document signatures",
          cause: error,
        });
      },
    }),

  /**
   * Get a signature by verification token
   */
  getSignatureByToken: (verificationToken: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.documentSignatures.findFirst({
          where: eq(documentSignatures.verificationToken, verificationToken),
          with: {
            document: true,
            signedBy: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "documentQueries.getSignatureByToken",
          "Error fetching signature by token",
          { verificationToken, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch signature",
          cause: error,
        });
      },
    }),

  /**
   * Get signature by ID
   */
  getSignatureById: (signatureId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.documentSignatures.findFirst({
          where: eq(documentSignatures.id, signatureId),
          with: {
            document: true,
            signedBy: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "documentQueries.getSignatureById",
          "Error fetching signature by ID",
          { signatureId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch signature",
          cause: error,
        });
      },
    }),

  /**
   * Get all SPT (Surat Perintah Tugas) assignment-letter documents belonging to the
   * current employee.
   *
   * The lookup follows the chain:
   *   `users.id` → `employees.userId` → `worksheetAssignments.employeeId`
   *   → `documents` (entityType = "worksheet_assignment")
   *
   * Returns an empty array when the user has no linked employee record or no
   * worksheet assignments yet.
   *
   * @param userId - The authenticated user's ID (from JWT context)
   * @returns An ordered list of assignment-letter documents for this employee
   */
  getMyAssignmentDocuments: (
    userId: string,
    input: z.infer<typeof documentSchema.getMyAssignmentDocumentsSchema>,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const employee = await db.query.employees.findFirst({
          where: eq(employees.userId, userId),
          columns: { id: true },
        });
        if (!employee) return { data: [], pageCount: 0 };

        const assignments = await db.query.worksheetAssignments.findMany({
          where: eq(worksheetAssignments.employeeId, employee.id),
          columns: { worksheetId: true },
        });
        if (!assignments.length) return { data: [], pageCount: 0 };

        const worksheetIds = assignments.map((a) => a.worksheetId);

        // SPT documents are stored on the ORDER entity (entityType "order",
        // type "assignment_letter"), so resolve the orders backing the
        // worksheets this employee is assigned to.
        const assignedWorksheets = await db.query.worksheets.findMany({
          where: inArray(worksheets.id, worksheetIds),
          columns: { orderId: true },
        });
        const orderIds = assignedWorksheets.map((w) => w.orderId);
        if (!orderIds.length) return { data: [], pageCount: 0 };

        const offset = (input.page - 1) * input.perPage;

        const baseWhere = and(
          eq(documents.entityType, "order"),
          inArray(documents.entityId, orderIds),
          eq(documents.type, "assignment_letter"),
          input.title ? ilike(documents.title, `%${input.title}%`) : undefined,
          input.status ? eq(documents.status, input.status) : undefined,
        );

        const [data, total] = await db.transaction(async (tx) => {
          const rows = await tx
            .select()
            .from(documents)
            .where(baseWhere)
            .orderBy(desc(documents.createdAt))
            .limit(input.perPage)
            .offset(offset);

          const total = await tx
            .select({ total: count() })
            .from(documents)
            .where(baseWhere)
            .then((res) => res[0]?.total ?? 0);

          return [rows, total];
        });

        return { data, pageCount: Math.ceil(total / input.perPage) };
      },
      catch: (error) => {
        logError(
          "documentQueries.getMyAssignmentDocuments",
          "Error fetching my assignment documents",
          { userId, input, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil dokumen penugasan",
          cause: error,
        });
      },
    }),

  /**
   * Batch create multiple document signatures
   */
  createDocumentSignatures: (
    signatures: Array<{
      documentId: string;
      signedByUserId: string;
      signerName: string;
      signerEmail?: string;
      purpose: string;
      signatureOrder?: number;
      qrCodePosition: {
        x: number;
        y: number;
        width: number;
        height: number;
        page: number;
      };
      verificationToken: string;
      verificationUrl: string;
      signatureData: string;
      fileHash: string;
      expiresAt?: string;
    }>,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const result = await db
          .insert(documentSignatures)
          .values(signatures)
          .returning();

        return result;
      },
      catch: (error) => {
        logError(
          "documentQueries.createDocumentSignatures",
          "Error creating document signatures",
          { count: signatures.length, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create document signatures",
          cause: error,
        });
      },
    }),
};

export default documentQueries;
