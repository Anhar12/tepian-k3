import orderQueries from "@tepian-k3/queries/pengujian/order.queries";
import worksheetQueries from "@tepian-k3/queries/pengujian/worksheet.queries";
import documentQueries from "@tepian-k3/queries/platform/document.queries";
import documentSchema from "@tepian-k3/schema/platform/document.schema";
import { createDocumentSignature } from "@tepian-k3/services/document-signing";
import {
  pdfSigningService,
  type QRCodePosition,
} from "@tepian-k3/services/pdf";
import {
  assertValidFileBuffer,
  FILE_SIZE_LIMITS,
  storageService,
} from "@tepian-k3/services/storage";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  protectedProcedure,
  publicProcedure,
  withIdempotency,
  withPermission,
} from "../../index";
import { processAndUploadFile } from "../../utils/image-upload";
import { runEffect } from "../../utils/run-effect";

export const documentRouter = createTRPCRouter({
  /**
   * Get paginated user's assignment documents (for dashboard)
   */
  getMyAssignmentDocuments: protectedProcedure
    .input(documentSchema.getMyAssignmentDocumentsSchema)
    .query(async ({ input, ctx }) => {
      const { data, pageCount } = await runEffect(
        documentQueries.getMyAssignmentDocuments(ctx.user.id, input),
      );
      return { data, pageCount };
    }),

  /**
   * Upload SPT document for a worksheet assignment
   */
  uploadSPT: withPermission("documents-spt.create")
    .input(formDataInput)
    .use(formDataProcedure(documentSchema.createSPTDocumentSchema))
    .mutation(
      withIdempotency(
        async ({ ctx }) =>
          await runEffect(
            Effect.gen(function* () {
              const worksheet = yield* worksheetQueries.getWorksheetById(
                ctx.input.data.worksheetId,
              );

              if (!worksheet) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Worksheet not found",
                });
              }

              const orderSpt = yield* orderQueries.getOrderDocument(
                worksheet.orderId,
                "assignment_letter",
              );

              // const spt = yield* worksheetQueries.getWorksheetDocument(
              //   ctx.input.data.worksheetId,
              //   "assignment_letter",
              // );

              if (orderSpt) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "Surat SPT sudah diupload untuk worksheet ini",
                });
              }

              const uploadedFile = yield* processAndUploadFile(
                ctx.input.data.file,
                { folder: "documents/worksheets/spt" },
              );

              const documentNumber = `SPT-${Date.now()}-${ctx.input.data.worksheetId.slice(0, 8)}`;

              yield* documentQueries.createDocument({
                documentNumber,
                type: "assignment_letter",
                title: ctx.input.data.title,
                entityType: "order",
                entityId: worksheet.orderId,
                fileUrl: uploadedFile.key,
                fileName: uploadedFile.filename,
                fileSize: uploadedFile.size,
                mimeType: uploadedFile.contentType,
                uploadedByUserId: ctx.user.id,
              });

              // yield* documentQueries.createDocument({
              //   documentNumber,
              //   type: "assignment_letter",
              //   title: ctx.input.data.title,
              //   entityType: "worksheet",
              //   entityId: ctx.input.data.worksheetId,
              //   fileUrl: uploadedFile.key,
              //   fileName: uploadedFile.filename,
              //   fileSize: uploadedFile.size,
              //   mimeType: uploadedFile.contentType,
              //   uploadedByUserId: ctx.user.id,
              // });

              yield* orderQueries.updateOrderStatus(
                worksheet.orderId,
                "proses_pengambilan_sampel",
              );

              return true;
            }),
          ),
        { ttl: 43200 },
      ),
    ),

  /**
   * Upload and create a document
   */
  uploadDocument: withPermission("documents.create")
    .input(formDataInput)
    .use(formDataProcedure(documentSchema.uploadDocumentSchema))
    .mutation(
      withIdempotency(
        async ({ ctx }) =>
          await runEffect(
            Effect.gen(function* () {
              const uploadedFile = yield* processAndUploadFile(
                ctx.input.data.file,
                {
                  folder: `documents/${ctx.input.data.entityType}/${ctx.input.data.type}`,
                },
              );

              // Generate document number
              const timestamp = Date.now();
              const documentNumber = `DOC-${ctx.input.data.type.toUpperCase()}-${timestamp}`;

              // Create document record
              const document = yield* documentQueries.createDocument({
                documentNumber,
                type: ctx.input.data.type,
                title: ctx.input.data.title,
                description: ctx.input.data.description,
                entityType: ctx.input.data.entityType,
                entityId: ctx.input.data.entityId,
                fileUrl: uploadedFile.key,
                fileName: uploadedFile.filename,
                fileSize: uploadedFile.size,
                mimeType: uploadedFile.contentType,
                uploadedByUserId: ctx.user.id,
              });

              // Update order status based on uploaded document type
              if (ctx.input.data.entityType === "order") {
                const docType = ctx.input.data.type;
                const orderId = ctx.input.data.entityId;

                if (docType === "offering_document") {
                  // Offering document uploaded → penawaran_diterbitkan
                  yield* orderQueries.updateOrderStatus(
                    orderId,
                    "penawaran_diterbitkan",
                  );
                } else if (docType === "approval_letter") {
                  // Admin approval letter uploaded → persetujuan_disetujui
                  yield* orderQueries.updateOrderStatus(
                    orderId,
                    "persetujuan_disetujui",
                  );
                } else if (
                  docType === "invoice" ||
                  docType === "cooperation_agreement"
                ) {
                  // Check if both invoice and cooperation agreement now exist
                  const orderDocs = yield* documentQueries.getDocumentsByEntity(
                    "order",
                    orderId,
                  );
                  const hasInvoice = orderDocs.some(
                    (d) => d.type === "invoice",
                  );
                  const hasCooperationAgreement = orderDocs.some(
                    (d) => d.type === "cooperation_agreement",
                  );

                  if (hasInvoice && hasCooperationAgreement) {
                    yield* orderQueries.updateOrderStatus(
                      orderId,
                      "tagihan_diterbitkan",
                    );
                  }
                }
              }

              return document;
            }),
          ),
        { ttl: 43200 },
      ),
    ),

  /**
   * Get documents for an entity
   */
  getDocumentsByEntity: withPermission("documents.view")
    .input(documentSchema.getDocumentsByEntitySchema)
    .query(
      async ({ input }) =>
        await runEffect(
          documentQueries.getDocumentsByEntity(
            input.entityType,
            input.entityId,
          ),
        ),
    ),

  /**
   * Get document by ID
   */
  getDocumentById: withPermission("documents.read")
    .input(
      z.object({
        documentId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(documentQueries.getDocumentById(input.documentId)),
    ),

  /**
   * Verify document by token (PUBLIC - for QR code scanning)
   */
  verifyDocument: publicProcedure
    .input(
      z.object({
        token: z.string(),
        checkFileIntegrity: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input, ctx }) => {
      const result = await runEffect(
        documentQueries.verifyDocumentByToken(input.token, {
          verifiedByUserId: ctx.user?.id,
          verifiedByIp: ctx.ip || undefined,
          verifiedByUserAgent: ctx.userAgent || undefined,
          checkFileIntegrity: input.checkFileIntegrity,
        }),
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
  getVerificationHistory: withPermission("documents.view")
    .input(documentSchema.getVerificationHistorySchema)
    .query(
      async ({ input }) =>
        await runEffect(
          documentQueries.getVerificationHistory(input.documentId),
        ),
    ),

  /**
   * Get all order documents
   */
  getOrderDocuments: withPermission("documents.view")
    .input(
      z.object({
        orderId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(documentQueries.getOrderDocuments(input.orderId)),
    ),

  /**
   * Get all testing documents
   */
  getTestingDocuments: withPermission("documents.view")
    .input(
      z.object({
        testingId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(documentQueries.getTestingDocuments(input.testingId)),
    ),

  /**
   * Upload and sign order invoice (combined operation)
   */
  uploadAndSignOrderInvoice: withPermission("documents.create")
    .input(
      z.object({
        orderId: z.uuidv7(),
        file: z.file().max(10 * 1024 * 1024),
      }),
    )
    .use(
      formDataProcedure(
        z.object({
          orderId: z.uuidv7(),
          file: z.file().max(10 * 1024 * 1024),
        }),
      ),
    )
    .mutation(
      withIdempotency(
        async ({ input, ctx }) =>
          await runEffect(
            Effect.gen(function* () {
              const uploadedFile = yield* processAndUploadFile(
                ctx.input.data.file,
                {
                  folder: "documents/orders/invoices",
                },
              );

              const documentNumber = `INV-${Date.now()}-${input.orderId.slice(
                0,
                8,
              )}`;

              // Create document
              const document = yield* documentQueries.createDocument({
                documentNumber,
                type: "invoice",
                title: `Invoice for Order ${input.orderId}`,
                entityType: "order",
                entityId: input.orderId,
                fileUrl: uploadedFile.key,
                fileName: uploadedFile.filename,
                fileSize: uploadedFile.size,
                mimeType: uploadedFile.contentType,
                uploadedByUserId: ctx.user.id,
              });

              // Sign immediately
              const signedDocument = yield* documentQueries.signDocumentWithJWT(
                document.id,
                ctx.user.id,
                process.env.APP_URL || "http://localhost:3000",
              );

              return signedDocument;
            }),
          ),
        { ttl: 43200 },
      ),
    ),

  /**
   * Upload and sign testing report (combined operation)
   */
  uploadAndSignTestingReport: withPermission("documents.create")
    .input(
      z.object({
        testingId: z.uuidv7(),
        file: z.file().max(10 * 1024 * 1024),
      }),
    )
    .use(
      formDataProcedure(
        z.object({
          testingId: z.uuidv7(),
          file: z.file().max(10 * 1024 * 1024),
        }),
      ),
    )
    .mutation(({ input, ctx }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const uploadedFile = yield* processAndUploadFile(
            ctx.input.data.file,
            {
              folder: "documents/testings/reports",
            },
          );

          const documentNumber = `RPT-${Date.now()}-${input.testingId.slice(
            0,
            8,
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
            process.env.APP_URL || "http://localhost:3000",
          );

          return signedDocument;
        }),
      ),
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
          file: z.file().max(10 * 1024 * 1024),
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
            }),
          ),
        }),
      ),
    )
    .mutation(
      withIdempotency(
        async ({ ctx }) =>
          await runEffect(
            Effect.gen(function* () {
              // Convert file to buffer
              const arrayBuffer = yield* Effect.tryPromise(() =>
                ctx.input.data.file.arrayBuffer(),
              );
              const originalBuffer = Buffer.from(arrayBuffer);

              // Validate file (must be PDF for signing)
              yield* Effect.tryPromise(() =>
                assertValidFileBuffer(
                  originalBuffer,
                  ctx.input.data.file.name,
                  ctx.input.data.file.type,
                  {
                    maxSize: FILE_SIZE_LIMITS.DOCUMENT,
                    allowedMimeTypes: ["application/pdf"],
                  },
                ),
              );

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
                  qrCode.userId,
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

              const signedPdfBuffer =
                yield* pdfSigningService.embedQRCodesInPDF(
                  originalBuffer,
                  qrCodeData,
                );

              // Upload signed PDF to storage
              const uploadedFile = yield* storageService.upload(
                signedPdfBuffer,
                {
                  filename: `signed-${ctx.input.data.file.name}`,
                  folder: `documents/${ctx.input.data.entityType}/signed`,
                },
              );

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
                  })),
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
            }),
          ),
        { ttl: 43200 },
      ),
    ),
});
