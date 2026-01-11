import { Effect } from "effect";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  formDataProcedure,
} from "../index";
import documentQueries from "@tepian-k3/queries/document.queries";
import documentSchema from "@tepian-k3/schema/document.schema";
import { storageService } from "@tepian-k3/services/storage";
import { z } from "zod";
import { runEffect } from "../utils/run-effect";

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
   * Sign a document with JWT and generate QR code
   */
  signDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          documentQueries.signDocumentWithJWT(
            input.documentId,
            ctx.user.id,
            process.env.APP_URL || "http://localhost:3000"
          )
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
    .query(({ input, ctx }) =>
      Effect.runPromise(
        documentQueries.verifyDocumentByToken(input.token, {
          verifiedByUserId: ctx.user?.id,
          verifiedByIp: ctx.header("x-forwarded-for") || undefined,
          verifiedByUserAgent: ctx.header("user-agent") || undefined,
          checkFileIntegrity: input.checkFileIntegrity,
        })
      )
    ),

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
});
