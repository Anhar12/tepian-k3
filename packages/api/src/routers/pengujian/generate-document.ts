import {
  OPERATIONAL_BANK_ACCOUNT,
  OPERATIONAL_BANK_ACCOUNT_NAME,
  OPERATIONAL_BANK_NAME,
  ORDER_STATUS,
  type OrderStatus,
} from "@tepian-k3/constants";
import { eq, sql } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { worksheets } from "@tepian-k3/db/schema";
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
import { tryPromise } from "../../utils/try-promise";
// import { storageService } from "@tepian-k3/services/storage";

export const generateDocumentRouter = createTRPCRouter({
  generateOfferingLetter: withPermission("documents-penawaran.create")
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

            if (
              ORDER_STATUS.indexOf(worksheet.order.status as OrderStatus) <
              ORDER_STATUS.indexOf("penawaran_diterbitkan")
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Koor. Admin harus menerbitkan penawaran terlebih dahulu sebelum mencetak surat penawaran",
              });
            }

            const offeringLetterHeader = yield* tryPromise(
              () =>
                generateOfferingLetterHeaderPdf({
                  companyName: worksheet.order.company.name,
                  regencyName: worksheet.order.company.regency.name,
                  letterNumber: input.letterNumber,
                  referenceNumber: input.referenceNumber ?? "",
                  referenceDate: input.referenceDate ?? "",
                  adminEmail: input.adminEmail,
                  adminContact: input.adminContact,
                }),
              "Gagal menghasilkan header surat penawaran",
            );

            const offeringLetter = yield* tryPromise(
              () =>
                generateOfferingLetterPdf({
                  worksheet,
                  companyName: worksheet.order.company.name,
                  letterNumber: input.letterNumber,
                  companyBankName: worksheet.order.company.companyBankName,
                  companyBankAccount:
                    worksheet.order.company.companyBankAccount,
                  companyBankAccountName:
                    worksheet.order.company.companyBankAccountName,
                }),
              "Gagal menghasilkan surat penawaran",
            );

            // Merge using the service
            const mergedPdf = yield* addCoverPage(
              offeringLetterHeader as Buffer,
              offeringLetter as Buffer,
            );

            // Save letter number + date so Invoice can reference them
            yield* tryPromise(
              () =>
                db
                  .update(worksheets)
                  .set({
                    offeringLetterNumber: input.letterNumber,
                    offeringLetterDate: new Date().toISOString(),
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                  })
                  .where(eq(worksheets.id, input.worksheetId)),
              "Gagal menyimpan nomor surat penawaran",
            );

            return {
              base64: Buffer.from(mergedPdf as Buffer).toString("base64"),
              filename: `offering-letter-${input.letterNumber}.pdf`,
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  generateSpkDocument: withPermission("documents-spk.create")
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

            if (!worksheet.offeringLetterNumber) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Surat penawaran harus dicetak terlebih dahulu sebelum mencetak SPK",
              });
            }

            if (
              ORDER_STATUS.indexOf(worksheet.order.status as OrderStatus) <
              ORDER_STATUS.indexOf("tagihan_diterbitkan")
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Bendahara harus menerbitkan tagihan terlebih dahulu sebelum mencetak SPK",
              });
            }

            const spk = yield* tryPromise(
              () =>
                generateSpkPdf({
                  worksheet,
                  agreementDate: input.agreementDate,
                  companyRepName: worksheet.order.company.headOfCompany,
                  companyRepPosition:
                    worksheet.order.company.headOfCompanyPosition,
                  companyRepAddress: worksheet.order.company.address,
                  companyBankName: worksheet.order.company.companyBankName,
                  companyBankAccount:
                    worksheet.order.company.companyBankAccount,
                  companyBankAccountName:
                    worksheet.order.company.companyBankAccountName,
                  operationalBankName: OPERATIONAL_BANK_NAME,
                  operationalBankAccount: OPERATIONAL_BANK_ACCOUNT,
                  operationalBankAccountName: OPERATIONAL_BANK_ACCOUNT_NAME,
                  letterNumber: input.letterNumber,
                  companyName: worksheet.order.company.name,
                }),
              "Gagal menghasilkan dokumen SPK",
            );

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

  generateTagihanDocument: withPermission("documents-invoice.create")
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

            if (!worksheet.offeringLetterNumber) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Surat penawaran harus dicetak terlebih dahulu sebelum mencetak tagihan",
              });
            }

            if (
              ORDER_STATUS.indexOf(worksheet.order.status as OrderStatus) <
              ORDER_STATUS.indexOf("tagihan_diterbitkan")
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Bendahara harus menerbitkan tagihan terlebih dahulu sebelum mencetak tagihan",
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

            const tagihan = yield* tryPromise(
              () =>
                generateTagihanPdf({
                  companyRegency: worksheet.order.company.regency.name,
                  letterNumber: input.letterNumber,
                  referenceNumber: input.referenceNumber,
                  referenceDate: input.referenceDate,
                  billingCode: input.billingCode,
                  billingAmount: totalItemCost,
                  operationalAmount: operationalCost,
                  billingExpiryDate: input.billingExpiryDate,
                  companyName: worksheet.order.company.name,
                }),
              "Gagal menghasilkan dokumen tagihan",
            );

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

            if (!worksheet.offeringLetterNumber) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Surat penawaran harus dicetak terlebih dahulu sebelum mencetak SPT",
              });
            }

            if (
              ORDER_STATUS.indexOf(worksheet.order.status as OrderStatus) <
              ORDER_STATUS.indexOf("menunggu_penerbitan_spt_jadwal")
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Jadwal harus ditetapkan terlebih dahulu sebelum mencetak SPT",
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

            const assignmentLetter = yield* tryPromise(
              () =>
                generateAssignmentLetterPdf({
                  companyName: worksheet.order.company.name,
                  companyRegency: worksheet.order.company.regency.name,
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
              "Gagal menghasilkan surat tugas",
            );

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
