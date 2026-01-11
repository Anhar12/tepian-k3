import { Effect } from "effect";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  formDataProcedure,
  withPermission,
  formDataInput,
} from "../index";
import documentQueries from "@tepian-k3/queries/document.queries";
import documentSchema from "@tepian-k3/schema/document.schema";
import { storageService } from "@tepian-k3/services/storage";
import { z } from "zod";
import { runEffect } from "../utils/run-effect";
import { createDocumentSignature } from "@tepian-k3/services/document-signing";
import {
  pdfSigningService,
  type QRCodePosition,
} from "@tepian-k3/services/pdf";

export const documentRouter = createTRPCRouter({
  /**
   * Upload and create a document
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        entityType: documentSchema.documentEntityTypeSchema,
        entityId: z.uuidv7(),
        type: documentSchema.documentTypeSchema,
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        file: z.file(),
      })
    )
    .use(formDataProcedure(documentSchema.uploadDocumentSchema))
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Convert file to buffer
            const arrayBuffer = yield* Effect.tryPromise(() =>
              ctx.input.data.file.arrayBuffer()
            );
            const buffer = Buffer.from(arrayBuffer);

            // Upload file to storage
            const uploadedFile = yield* storageService.upload(buffer, {
              filename: ctx.input.data.file.name,
              folder: `documents/${input.entityType}/${input.type}`,
            });

            // Generate document number
            const timestamp = Date.now();
            const documentNumber = `DOC-${input.type.toUpperCase()}-${timestamp}`;

            // Create document record
            const document = yield* documentQueries.createDocument({
              documentNumber,
              type: input.type,
              title: input.title,
              description: input.description,
              entityType: input.entityType,
              entityId: input.entityId,
              fileUrl: uploadedFile.key,
              fileName: ctx.input.data.file.name,
              fileSize: ctx.input.data.file.size,
              mimeType: ctx.input.data.file.type,
              uploadedByUserId: ctx.user.id,
            });

            return document;
          })
        )
    ),

  /**
   * Get documents for an entity
   */
  getDocumentsByEntity: protectedProcedure
    .input(documentSchema.getDocumentsByEntitySchema)
    .query(
      async ({ input }) =>
        await runEffect(
          documentQueries.getDocumentsByEntity(input.entityType, input.entityId)
        )
    ),

  /**
   * Get document by ID
   */
  getDocumentById: protectedProcedure
    .input(
      z.object({
        documentId: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await runEffect(documentQueries.getDocumentById(input.documentId))
    ),

  /**
   * Verify document by token (PUBLIC - for QR code scanning)
   */
  verifyDocument: publicProcedure
    .input(
      z.object({
        token: z.string(),
        checkFileIntegrity: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const result = await runEffect(
        documentQueries.verifyDocumentByToken(input.token, {
          verifiedByUserId: ctx.user?.id,
          verifiedByIp: ctx.ip || undefined,
          verifiedByUserAgent: ctx.userAgent || undefined,
          checkFileIntegrity: input.checkFileIntegrity,
        })
      );

      // Map response to match frontend expectation
      return {
        isValid: result.valid,
        document: result.document,
        error: result.error,
        payload: result.payload,
      };
    }),

  /**
   * Get verification history for a document
   */
  getVerificationHistory: protectedProcedure
    .input(documentSchema.getVerificationHistorySchema)
    .query(
      async ({ input }) =>
        await runEffect(
          documentQueries.getVerificationHistory(input.documentId)
        )
    ),

  /**
   * Get all order documents
   */
  getOrderDocuments: protectedProcedure
    .input(
      z.object({
        orderId: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await runEffect(documentQueries.getOrderDocuments(input.orderId))
    ),

  /**
   * Get all testing documents
   */
  getTestingDocuments: protectedProcedure
    .input(
      z.object({
        testingId: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await runEffect(documentQueries.getTestingDocuments(input.testingId))
    ),

  /**
   * Upload and sign order invoice (combined operation)
   */
  uploadAndSignOrderInvoice: protectedProcedure
    .input(
      z.object({
        orderId: z.uuidv7(),
        file: z.file(),
      })
    )
    .use(
      formDataProcedure(
        z.object({
          orderId: z.uuidv7(),
          file: z.file(),
        })
      )
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Upload invoice
            const arrayBuffer = yield* Effect.tryPromise(() =>
              ctx.input.data.file.arrayBuffer()
            );
            const buffer = Buffer.from(arrayBuffer);

            const uploadedFile = yield* storageService.upload(buffer, {
              filename: ctx.input.data.file.name,
              folder: "documents/order/invoice",
            });

            const documentNumber = `INV-${Date.now()}-${input.orderId.slice(
              0,
              8
            )}`;

            // Create document
            const document = yield* documentQueries.createDocument({
              documentNumber,
              type: "invoice",
              title: `Invoice for Order ${input.orderId}`,
              entityType: "order",
              entityId: input.orderId,
              fileUrl: uploadedFile.key,
              fileName: ctx.input.data.file.name,
              fileSize: ctx.input.data.file.size,
              mimeType: ctx.input.data.file.type,
              uploadedByUserId: ctx.user.id,
            });

            // Sign immediately
            const signedDocument = yield* documentQueries.signDocumentWithJWT(
              document.id,
              ctx.user.id,
              process.env.APP_URL || "http://localhost:3000"
            );

            return signedDocument;
          })
        )
    ),

  /**
   * Upload and sign testing report (combined operation)
   */
  uploadAndSignTestingReport: protectedProcedure
    .input(
      z.object({
        testingId: z.uuidv7(),
        file: z.file(),
      })
    )
    .use(
      formDataProcedure(
        z.object({
          testingId: z.uuidv7(),
          file: z.file(),
        })
      )
    )
    .mutation(({ input, ctx }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const arrayBuffer = yield* Effect.tryPromise(() =>
            ctx.input.data.file.arrayBuffer()
          );
          const buffer = Buffer.from(arrayBuffer);

          const uploadedFile = yield* storageService.upload(buffer, {
            filename: ctx.input.data.file.name,
            folder: "documents/testing/testing_report",
          });

          const documentNumber = `RPT-${Date.now()}-${input.testingId.slice(
            0,
            8
          )}`;

          const document = yield* documentQueries.createDocument({
            documentNumber,
            type: "testing_report",
            title: `Testing Report ${input.testingId}`,
            entityType: "testing",
            entityId: input.testingId,
            fileUrl: uploadedFile.key,
            fileName: ctx.input.data.file.name,
            fileSize: ctx.input.data.file.size,
            mimeType: ctx.input.data.file.type,
            uploadedByUserId: ctx.user.id,
          });

          const signedDocument = yield* documentQueries.signDocumentWithJWT(
            document.id,
            ctx.user.id,
            process.env.APP_URL || "http://localhost:3000"
          );

          return signedDocument;
        })
      )
    ),

  /**
   * Sign an uploaded PDF with QR codes
   * Accepts a PDF file and QR code positions, embeds QR codes into the PDF
   */
  signDocumentWithQRCodes: withPermission("document-signature.create")
    .input(formDataInput)
    .use(
      formDataProcedure(
        z.object({
          entityId: z.uuidv7(),
          entityType: documentSchema.documentEntityTypeSchema,
          type: documentSchema.documentTypeSchema,
          title: z.string().min(1).max(255),
          file: z.file(),
          qrCodes: z.array(
            z.object({
              userId: z.uuidv7(),
              userName: z.string(),
              purpose: z.string(),
              position: z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
                page: z.number().int().min(0),
              }),
            })
          ),
        })
      )
    )
    .mutation(
      async ({ ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Convert file to buffer
            const arrayBuffer = yield* Effect.tryPromise(() =>
              ctx.input.data.file.arrayBuffer()
            );
            const originalBuffer = Buffer.from(arrayBuffer);

            // First, create document signatures for all signers
            const baseUrl = process.env.APP_URL || "http://localhost:3000";
            const documentSignatures = [];

            for (const qrCode of ctx.input.data.qrCodes) {
              const signature = yield* createDocumentSignature(
                "temp-id", // Will be updated after document creation
                `TEMP-${Date.now()}`,
                ctx.input.data.entityType,
                ctx.input.data.entityId,
                ctx.input.data.type,
                "temp-url", // Will be updated after upload
                originalBuffer,
                qrCode.userId
              );

              documentSignatures.push({
                ...qrCode,
                verificationUrl: `${baseUrl}/verify/${signature.verificationToken}`,
                signatureData: signature.signatureData,
                verificationToken: signature.verificationToken,
                fileHash: signature.fileHash,
              });
            }

            // Embed QR codes into the PDF
            const qrCodeData = documentSignatures.map((sig) => ({
              signature: {
                userId: sig.userId,
                userName: sig.userName,
                purpose: sig.purpose,
                verificationUrl: sig.verificationUrl,
              },
              position: sig.position as QRCodePosition,
            }));

            const signedPdfBuffer = yield* pdfSigningService.embedQRCodesInPDF(
              originalBuffer,
              qrCodeData
            );

            // Upload signed PDF to storage
            const uploadedFile = yield* storageService.upload(signedPdfBuffer, {
              filename: `signed-${ctx.input.data.file.name}`,
              folder: `documents/${ctx.input.data.entityType}/signed`,
            });

            // Generate document number
            const timestamp = Date.now();
            const documentNumber = `DOC-SIGNED-${ctx.input.data.entityType.toUpperCase()}-${timestamp}`;

            // Create document record
            const document = yield* documentQueries.createDocument({
              documentNumber,
              type: ctx.input.data.type,
              title: ctx.input.data.title,
              entityType: ctx.input.data.entityType,
              entityId: ctx.input.data.entityId,
              fileUrl: uploadedFile.key,
              fileName: ctx.input.data.file.name,
              fileSize: signedPdfBuffer.length,
              mimeType: "application/pdf",
              uploadedByUserId: ctx.user.id,
            });

            // Store document signatures in database
            const signatureRecords =
              yield* documentQueries.createDocumentSignatures(
                documentSignatures.map((sig, index) => ({
                  documentId: document.id,
                  signedByUserId: sig.userId,
                  signerName: sig.userName,
                  purpose: sig.purpose,
                  signatureOrder: index + 1,
                  qrCodePosition: sig.position,
                  verificationToken: sig.verificationToken,
                  verificationUrl: sig.verificationUrl,
                  signatureData: sig.signatureData,
                  fileHash: sig.fileHash,
                }))
              );

            return {
              document,
              signatures: signatureRecords.map((sig) => ({
                id: sig.id,
                userId: sig.signedByUserId,
                userName: sig.signerName,
                purpose: sig.purpose,
                verificationUrl: sig.verificationUrl,
                signatureOrder: sig.signatureOrder,
              })),
              url: storageService.getPublicUrl(uploadedFile.key),
            };
          })
        )
    ),
});
