import generateDocumentSchema from "@tepian-k3/schema/generate-document.schema";
import { createTRPCRouter, withPermission } from "..";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";
import { Effect } from "effect";
import {
  addCoverPage,
  generateOfferingLetterHeaderPdf,
  generateOfferingLetterPdf,
} from "@tepian-k3/services/pdf";
import worksheetQueries from "@tepian-k3/queries/worksheet.queries";
import { storageService } from "@tepian-k3/services/storage";

export const generateDocumentRouter = createTRPCRouter({
  generateOfferingLetter: withPermission("documents.create")
    .input(generateDocumentSchema.generateOfferingLetterDocumentSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const worksheet =
              yield* worksheetQueries.getWorksheetTransactionDetail(
                input.worksheetId,
              );

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            const offeringLetterHeader = yield* Effect.tryPromise(() =>
              generateOfferingLetterHeaderPdf({
                companyName: worksheet.order.company.name,
                regencyName: worksheet.order.company.regency.name,
                letterNumber: input.letterNumber,
                referenceNumber: input.referenceNumber ?? "",
                referenceDate: input.referenceDate ?? "",
                adminEmail: input.adminEmail,
                adminContact: input.adminContact,
              }),
            );

            const offeringLetter = yield* Effect.tryPromise(() =>
              generateOfferingLetterPdf({
                worksheet,
                companyName: worksheet.order.company.name,
                letterNumber: input.letterNumber,
              }),
            );

            // Merge using the service
            const mergedPdf = yield* addCoverPage(
              offeringLetterHeader as Buffer,
              offeringLetter as Buffer,
            );

            const uploadedOfferingLetter = yield* storageService.upload(
              mergedPdf as Buffer,
              {
                filename: `offering-letter-${input.letterNumber}.pdf`,
                contentType: "application/pdf",
                folder: "generated-documents/offering-letters",
              },
            );

            return {
              offeringLetterUrl: uploadedOfferingLetter.key,
            };
          }),
        ),
    ),
});
