import { Effect } from "effect";
import { db } from "@tepian-k3/db/client";
import { documents } from "@tepian-k3/db/schema";
import { eq } from "@tepian-k3/db";
import { TRPCError } from "@trpc/server";
import type { CreateDocumentInput } from "@tepian-k3/types/document.types";
import { logError } from "@tepian-k3/services/logger";

/**
 * Transactional document operations
 * Uses db.transaction() for atomic operations
 */
const documentTransactionQueries = {
  /**
   * Complete transaction: Create document, generate signature, and update document
   * This ensures all operations succeed or all fail together
   */
  createSignedDocument: (input: {
    documentData: CreateDocumentInput;
    signatureData: {
      signatureData: string;
      verificationToken: string;
      verificationUrl: string;
    };
    userId: string;
  }) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // 1. Create document
            const createdDocuments = await tx
              .insert(documents)
              .values({
                documentNumber: input.documentData.documentNumber,
                type: input.documentData.type,
                title: input.documentData.title,
                description: input.documentData.description,
                entityType: input.documentData.entityType,
                entityId: input.documentData.entityId,
                fileUrl: input.documentData.fileUrl,
                fileName: input.documentData.fileName,
                fileSize: input.documentData.fileSize,
                mimeType: input.documentData.mimeType,
                uploadedByUserId: input.documentData.uploadedByUserId,
                status: "draft",
              })
              .returning();

            const document = createdDocuments[0];

            if (!document) {
              throw new Error("Failed to create document");
            }

            // 2. Update with signature
            const signedDocuments = await tx
              .update(documents)
              .set({
                signatureData: input.signatureData.signatureData,
                verificationToken: input.signatureData.verificationToken,
                verificationUrl: input.signatureData.verificationUrl,
                signedByUserId: input.userId,
                signedAt: new Date().toISOString(),
                status: "signed",
              })
              .where(eq(documents.id, document.id))
              .returning();

            const signedDocument = signedDocuments[0];

            if (!signedDocument) {
              throw new Error("Failed to sign document");
            }

            return signedDocument;
          }),
        catch: (error) => {
          logError(
            "documentTransactionQueries.createSignedDocument",
            "Error in transaction",
            { input, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat dan menandatangani dokumen",
            cause: error,
          });
        },
      });

      return result;
    }),
};

export default documentTransactionQueries;
