import { Effect } from "effect";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  withPermission,
} from "../index";
import testingQueries from "@tepian-k3/queries/testing.queries";
import documentQueries from "@tepian-k3/queries/document.queries";
import { storageService } from "@tepian-k3/services/storage";
import { z } from "zod";
import { runEffect } from "../utils/run-effect";
import { TESTING_STATUSES, type DocumentType } from "@tepian-k3/constants";
import { TRPCError } from "@trpc/server";

const testingDocumentTypes = [
  "testing_report",
  "lab_certificate",
  "sample_analysis",
  "calibration_certificate",
] as const;

export const testingRouter = createTRPCRouter({
  /**
   * Get all testings with pagination (Admin)
   */
  getAllTestings: withPermission("testing.read")
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          testingQueries.getAllTestings(input.page, input.perPage, input.search),
        ),
    ),

  /**
   * Get testing by ID with all relations
   */
  getTestingById: withPermission("testing.read")
    .input(
      z.object({
        testingId: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const testing = await runEffect(
        testingQueries.getTestingById(input.testingId),
      );

      if (!testing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Testing tidak ditemukan",
        });
      }

      return testing;
    }),

  /**
   * Get testing with documents
   */
  getTestingWithDocuments: withPermission("testing.read")
    .input(
      z.object({
        testingId: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const [testing, documents] = await Promise.all([
        runEffect(testingQueries.getTestingById(input.testingId)),
        runEffect(documentQueries.getTestingDocuments(input.testingId)),
      ]);

      if (!testing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Testing tidak ditemukan",
        });
      }

      return {
        ...testing,
        documents,
      };
    }),

  /**
   * Update testing status
   */
  updateStatus: withPermission("testing.update")
    .input(
      z.object({
        testingId: z.uuidv7(),
        status: z.enum(TESTING_STATUSES),
        note: z.string().optional(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          testingQueries.updateTestingStatus(
            input.testingId,
            input.status,
            input.note,
          ),
        ),
    ),

  /**
   * Upload testing document
   */
  uploadDocument: withPermission("testing.update")
    .input(formDataInput)
    .use(
      formDataProcedure(
        z.object({
          testingId: z.uuidv7(),
          documentType: z.enum(testingDocumentTypes),
          title: z.string().min(1).max(255),
          file: z.instanceof(File),
        }),
      ),
    )
    .mutation(
      async ({ ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const { testingId, documentType, title, file } = ctx.input.data;

            // Verify testing exists
            const testing = yield* testingQueries.getTestingById(testingId);

            if (!testing) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Testing tidak ditemukan",
                }),
              );
            }

            // Convert file to buffer
            const arrayBuffer = yield* Effect.tryPromise(() =>
              file.arrayBuffer(),
            );
            const buffer = Buffer.from(arrayBuffer);

            // Upload file to storage
            const filename = `${documentType}-${testing.testingNumber}-${Date.now()}.${file.name.split(".").pop()}`;
            const uploadedFile = yield* storageService.upload(buffer, {
              filename,
              folder: `documents/testing/${documentType}`,
              contentType: file.type,
            });

            // Generate document number
            const documentNumber = `${documentType.toUpperCase().replace(/_/g, "-")}-${testing.testingNumber}-${Date.now()}`;

            // Create document record
            const document = yield* documentQueries.createDocument({
              documentNumber,
              type: documentType as DocumentType,
              title,
              description: `${title} untuk Testing ${testing.testingNumber}`,
              entityType: "testing",
              entityId: testingId,
              fileUrl: uploadedFile.key,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              uploadedByUserId: ctx.user.id,
            });

            return {
              documentId: document.id,
              url: storageService.getPublicUrl(uploadedFile.key),
            };
          }),
        ),
    ),
});
