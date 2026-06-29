import {
  OPERATIONAL_BANK_ACCOUNT,
  OPERATIONAL_BANK_ACCOUNT_NAME,
  OPERATIONAL_BANK_NAME,
} from "@tepian-k3/constants";
import worksheetQueries from "@tepian-k3/queries/pengujian/worksheet.queries";
import generateDocumentSchema from "@tepian-k3/schema/pengujian/generate-document.schema";
import {
  addCoverPage,
  generateAssignmentLetterPdf,
  generateOfferingLetterHeaderPdf,
  generateOfferingLetterPdf,
  generateSpkPdf,
  generateTagihanPdf,
} from "@tepian-k3/services/pdf";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { createTRPCRouter, withPermission } from "../..";
import { runEffect } from "../../utils/run-effect";
import { handleTRPCError } from "@tepian-k3/utils/handle-trpc-error";
import { logError } from "@tepian-k3/services/logger";
// import { storageService } from "@tepian-k3/services/storage";

export const generateDocumentRouter = createTRPCRouter({
  generateOfferingLetter: withPermission("documents.create")
    .input(generateDocumentSchema.generateOfferingLetterDocumentSchema)
    .mutation(
      async ({ input, ctx }) =>
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

            const company = worksheet.order.company;
            if (!company) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Perusahaan tidak ditemukan pada pesanan ini",
              });
            }

            const offeringLetterHeader = yield* Effect.tryPromise({
              try: () =>
                generateOfferingLetterHeaderPdf({
                  companyName: company.name,
                  regencyName: company.regency.name,
                  letterNumber: input.letterNumber,
                  referenceNumber: input.referenceNumber ?? "",
                  referenceDate: input.referenceDate ?? "",
                  adminEmail: input.adminEmail,
                  adminContact: input.adminContact,
                }),
              catch: (error) => {
                logError(
                  "generateOfferingLetterHeaderPdf",
                  "Gagal menghasilkan header surat penawaran",
                  { error },
                );
                return handleTRPCError(
                  error,
                  "Gagal menghasilkan header surat penawaran",
                  "INTERNAL_SERVER_ERROR",
                );
              },
            });

            const offeringLetter = yield* Effect.tryPromise({
              try: () =>
                generateOfferingLetterPdf({
                  worksheet,
                  companyName: company.name,
                  letterNumber: input.letterNumber,
                  companyBankName: company.companyBankName,
                  companyBankAccount: company.companyBankAccount,
                  companyBankAccountName: company.companyBankAccountName,
                }),
              catch: (error) => {
                logError(
                  "generateOfferingLetterPdf",
                  "Gagal menghasilkan surat penawaran",
                  { error },
                );
                return handleTRPCError(
                  error,
                  "Gagal menghasilkan surat penawaran",
                  "INTERNAL_SERVER_ERROR",
                );
              },
            });

            // Merge using the service
            const mergedPdf = yield* addCoverPage(
              offeringLetterHeader as Buffer,
              offeringLetter as Buffer,
            );

            // const uploadedOfferingLetter = yield* storageService.upload(
            //   mergedPdf as Buffer,
            //   {
            //     filename: `offering-letter-${input.letterNumber}.pdf`,
            //     contentType: "application/pdf",
            //     folder: "generated-documents/offering-letters",
            //   },
            // );

            // Persist the offering letter number + issue date on the worksheet.
            // These gate the downstream Invoice/SPK/SPT actions and pre-fill the
            // Invoice reference, so they must be saved on every Cetak.
            yield* worksheetQueries.saveOfferingLetterInfo(
              input.worksheetId,
              ctx.user.id,
              input.letterNumber,
            );

            return {
              base64: Buffer.from(mergedPdf as Buffer).toString("base64"),
              filename: `offering-letter-${input.letterNumber}.pdf`,
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  generateSpkDocument: withPermission("documents.create")
    .input(generateDocumentSchema.generateSpkDocumentSchema)
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

            const company = worksheet.order.company;
            if (!company) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Perusahaan tidak ditemukan pada pesanan ini",
              });
            }

            const spk = yield* Effect.tryPromise({
              try: () =>
                generateSpkPdf({
                  worksheet,
                  agreementDate: input.agreementDate,
                  companyRepName: company.headOfCompany,
                  companyRepPosition: company.headOfCompanyPosition,
                  companyRepAddress: company.address ?? "",
                  companyBankName: company.companyBankName,
                  companyBankAccount: company.companyBankAccount,
                  companyBankAccountName: company.companyBankAccountName,
                  operationalBankName: OPERATIONAL_BANK_NAME,
                  operationalBankAccount: OPERATIONAL_BANK_ACCOUNT,
                  operationalBankAccountName: OPERATIONAL_BANK_ACCOUNT_NAME,
                  letterNumber: input.letterNumber,
                  companyName: company.name,
                }),
              catch: (error) => {
                logError("generateSpkPdf", "Gagal menghasilkan dokumen SPK", {
                  error,
                });
                return handleTRPCError(
                  error,
                  "Gagal menghasilkan dokumen SPK",
                  "INTERNAL_SERVER_ERROR",
                );
              },
            });

            // const uploadedSpk = yield* storageService.upload(spk as Buffer, {
            //   filename: `spk-${input.letterNumber}.pdf`,
            //   contentType: "application/pdf",
            //   folder: "generated-documents/spks",
            // });

            return {
              base64: Buffer.from(spk as Buffer).toString("base64"),
              filename: `spk-${input.letterNumber}.pdf`,
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  generateTagihanDocument: withPermission("documents.create")
    .input(generateDocumentSchema.generateTagihanDocumentSchema)
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

            const company = worksheet.order.company;
            if (!company) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Perusahaan tidak ditemukan pada pesanan ini",
              });
            }

            const operationalCost = worksheet.operationalCosts.reduce(
              (total, cost) =>
                total + (cost.unitCost ?? 0) * cost.unitCount * cost.days,
              0,
            );

            // Sum subTotal from orderItems whose matching worksheetItem is ready.
            // Uses the snapshotted price from the order (not the current catalog price).
            const totalItemCost = worksheet.order.items.reduce(
              (total, orderItem) => {
                const isReady = worksheet.items.some(
                  (wi) =>
                    wi.parameterId === orderItem.parameterId &&
                    wi.locationId === orderItem.locationId &&
                    wi.isReady,
                );
                return total + (isReady ? orderItem.subTotal : 0);
              },
              0,
            );

            const tagihan = yield* Effect.tryPromise({
              try: () =>
                generateTagihanPdf({
                  companyRegency: company.regency.name,
                  letterNumber: input.letterNumber,
                  referenceNumber: input.referenceNumber,
                  referenceDate: input.referenceDate,
                  billingCode: input.billingCode,
                  billingAmount: totalItemCost,
                  operationalAmount: operationalCost,
                  billingExpiryDate: input.billingExpiryDate,
                  companyName: company.name,
                }),
              catch: (error) => {
                logError(
                  "generateTagihanPdf",
                  "Gagal menghasilkan dokumen tagihan",
                  { error },
                );
                return handleTRPCError(
                  error,
                  "Gagal menghasilkan dokumen tagihan",
                  "INTERNAL_SERVER_ERROR",
                );
              },
            });

            // const uploadedTagihan = yield* storageService.upload(
            //   tagihan as Buffer,
            //   {
            //     filename: `tagihan-${input.letterNumber}.pdf`,
            //     contentType: "application/pdf",
            //     folder: "generated-documents/tagihans",
            //   },
            // );

            return {
              base64: Buffer.from(tagihan as Buffer).toString("base64"),
              filename: `tagihan-${input.letterNumber}.pdf`,
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  generateAssignmentLetter: withPermission("documents-spt.create")
    .input(generateDocumentSchema.generateAssignmentLetter)
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

            const company = worksheet.order.company;
            if (!company) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Perusahaan tidak ditemukan pada pesanan ini",
              });
            }

            // check if worksheet has startDate and endDate
            if (!worksheet.startDate || !worksheet.endDate) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Worksheet tidak memiliki tanggal penugasan",
              });
            }

            // check if worksheet has assignment details
            if (!worksheet.assignments || worksheet.assignments.length === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Worksheet tidak memiliki data penugasan",
              });
            }

            const assignmentLetter = yield* Effect.tryPromise({
              try: () =>
                generateAssignmentLetterPdf({
                  companyName: company.name,
                  companyRegency: company.regency.name,
                  orderDate: worksheet.order.createdAt,
                  assignmentDateStart: worksheet.startDate!,
                  assignmentDateEnd: worksheet.endDate!,
                  letterNumber: input.letterNumber,
                  assignmentLetterNumber: input.assignmentLetterNumber,
                  financingSource: worksheet.operationalCosts
                    .map((cost) => cost.item)
                    .join(", "),
                  assignees: worksheet.assignments.map((assignee) => ({
                    ...assignee,
                    employee: {
                      ...assignee.employee,
                      position: assignee.employee.position || null,
                    },
                  })),
                }),
              catch: (error) => {
                logError(
                  "generateAssignmentLetterPdf",
                  "Gagal menghasilkan surat tugas",
                  { error },
                );
                return handleTRPCError(
                  error,
                  "Gagal menghasilkan surat tugas",
                  "INTERNAL_SERVER_ERROR",
                );
              },
            });

            return {
              base64: Buffer.from(assignmentLetter as Buffer).toString(
                "base64",
              ),
              filename: `surat-tugas-${input.assignmentLetterNumber}.pdf`,
              contentType: "application/pdf",
            };
          }),
        ),
    ),
});
