import crypto from "node:crypto";
import {
  ADMIN_EMAIL,
  ADMIN_PHONE,
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
  pdfSigningService,
} from "@tepian-k3/services/pdf";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { createTRPCRouter, withPermission } from "../..";
import { runEffect } from "../../utils/run-effect";
import { handleTRPCError } from "@tepian-k3/utils/handle-trpc-error";
import { logError } from "@tepian-k3/services/logger";
import { storageService } from "@tepian-k3/services/storage";
import documentQueries from "@tepian-k3/queries/platform/document.queries";
import { emailService } from "@tepian-k3/services/email";
import {
  createDocumentSignature,
  createTTERequestToken,
} from "@tepian-k3/services/document-signing";

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
                { unmask: true },
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
                  adminEmail: input.adminEmail || ADMIN_EMAIL,
                  adminContact: input.adminContact || ADMIN_PHONE,
                  companyRepName: company.headOfCompany,
                  companyRepPosition: company.headOfCompanyPosition,
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
                  companyRepName: company.headOfCompany,
                  companyRepPosition: company.headOfCompanyPosition,
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
            let finalPdfBuffer = Buffer.from(
              (yield* addCoverPage(
                offeringLetterHeader as Buffer,
                offeringLetter as Buffer,
              )) as Buffer,
            );

            // If signatures were specified, embed QR codes into PDF and persist record
            if (input.signatures && input.signatures.length > 0) {
              const baseUrl =
                process.env.APP_URL ||
                process.env.VITE_APP_URL ||
                "http://localhost:3000";
              const docSignatures = [];

              for (const sigInput of input.signatures) {
                const signature = yield* createDocumentSignature(
                  "temp-id",
                  input.letterNumber,
                  "worksheet",
                  input.worksheetId,
                  "offering_document",
                  "temp-url",
                  finalPdfBuffer,
                  sigInput.userId,
                );

                docSignatures.push({
                  ...sigInput,
                  verificationUrl: `${baseUrl}/verify/${signature.verificationToken}`,
                  signatureData: signature.signatureData,
                  verificationToken: signature.verificationToken,
                  fileHash: signature.fileHash,
                });
              }

              const qrCodeData = docSignatures.map((sig) => ({
                signature: {
                  userId: sig.userId,
                  userName: sig.userName,
                  purpose: sig.purpose,
                  verificationUrl: sig.verificationUrl,
                },
                position: {
                  x: sig.x,
                  y: sig.y,
                  width: sig.width,
                  height: sig.height,
                  page: sig.page,
                },
              }));

              const signedPdf = yield* pdfSigningService.embedQRCodesInPDF(
                finalPdfBuffer,
                qrCodeData,
              );
              finalPdfBuffer = Buffer.from(signedPdf);

              const filename = `offering-letter-${input.letterNumber}.pdf`;
              const uploadedFile = yield* storageService.upload(
                finalPdfBuffer,
                {
                  filename,
                  contentType: "application/pdf",
                  folder: "documents/worksheet/offering-letters",
                },
              );

              const documentNumber = `DOC-OFFERING-${input.letterNumber}`;
              const document = yield* documentQueries.createDocument({
                documentNumber,
                type: "offering_document",
                title: `Surat Penawaran - ${input.letterNumber}`,
                description: `Surat Penawaran untuk Worksheet ${input.worksheetId}`,
                entityType: "worksheet",
                entityId: input.worksheetId,
                fileUrl: uploadedFile.key,
                fileName: filename,
                fileSize: finalPdfBuffer.length,
                mimeType: "application/pdf",
                uploadedByUserId: ctx.user.id,
              });

              yield* documentQueries.createDocumentSignatures(
                docSignatures.map((sig, index) => ({
                  documentId: document.id,
                  signedByUserId: sig.userId,
                  signerName: sig.userName,
                  purpose: sig.purpose,
                  signatureOrder: index + 1,
                  qrCodePosition: {
                    x: sig.x,
                    y: sig.y,
                    width: sig.width,
                    height: sig.height,
                    page: sig.page,
                  },
                  verificationToken: sig.verificationToken,
                  verificationUrl: sig.verificationUrl,
                  signatureData: sig.signatureData,
                  fileHash: sig.fileHash,
                })),
              );
            }

            // Persist the offering letter number + issue date on the worksheet.
            yield* worksheetQueries.saveOfferingLetterInfo(
              input.worksheetId,
              ctx.user.id,
              input.letterNumber,
            );

            return {
              base64: finalPdfBuffer.toString("base64"),
              filename: `offering-letter-${input.letterNumber}.pdf`,
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  generateSpkDocument: withPermission("documents.create")
    .input(generateDocumentSchema.generateSpkDocumentSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const worksheet =
              yield* worksheetQueries.getWorksheetTransactionDetail(
                input.worksheetId,
                { unmask: true },
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
                  companyRepName: company.headOfCompany ?? "",
                  companyRepPosition: company.headOfCompanyPosition ?? "",
                  companyRepAddress: company.address ?? "",
                  companyBankName: company.companyBankName ?? "",
                  companyBankAccount: company.companyBankAccount ?? "",
                  companyBankAccountName: company.companyBankAccountName ?? "",
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

            // Convert PDF to Buffer
            let spkBuffer = Buffer.from(spk as Buffer);

            if (input.signatures && input.signatures.length > 0) {
              const baseUrl =
                process.env.APP_URL ||
                process.env.VITE_APP_URL ||
                "http://localhost:3000";
              const docSignatures = [];

              for (const sigInput of input.signatures) {
                const signature = yield* createDocumentSignature(
                  "temp-id",
                  input.letterNumber,
                  "order",
                  worksheet.orderId,
                  "cooperation_agreement",
                  "temp-url",
                  spkBuffer,
                  sigInput.userId,
                );

                docSignatures.push({
                  ...sigInput,
                  verificationUrl: `${baseUrl}/verify/${signature.verificationToken}`,
                  signatureData: signature.signatureData,
                  verificationToken: signature.verificationToken,
                  fileHash: signature.fileHash,
                });
              }

              const qrCodeData = docSignatures.map((sig) => ({
                signature: {
                  userId: sig.userId,
                  userName: sig.userName,
                  purpose: sig.purpose,
                  verificationUrl: sig.verificationUrl,
                },
                position: {
                  x: sig.x,
                  y: sig.y,
                  width: sig.width,
                  height: sig.height,
                  page: sig.page,
                },
              }));

              const signedPdf = yield* pdfSigningService.embedQRCodesInPDF(
                spkBuffer,
                qrCodeData,
              );
              spkBuffer = Buffer.from(signedPdf);
            }

            // Upload draft SPK to storage
            const filename = `spk-draft-${input.letterNumber}-${Date.now()}.pdf`;
            const uploadedSpk = yield* storageService.upload(spkBuffer, {
              filename,
              contentType: "application/pdf",
              folder: "documents/order/spk",
            });

            // Create document record
            const documentNumber = `SPK-${worksheet.order.orderNumber}-${Date.now()}`;
            const document = yield* documentQueries.createDocument({
              documentNumber,
              type: "cooperation_agreement",
              title: `Surat Perjanjian Kerjasama (SPK) - ${worksheet.order.orderNumber}`,
              description: `Draft SPK untuk Order ${worksheet.order.orderNumber}`,
              entityType: "order",
              entityId: worksheet.orderId,
              fileUrl: uploadedSpk.key,
              fileName: filename,
              fileSize: spkBuffer.length,
              mimeType: "application/pdf",
              uploadedByUserId: ctx.user.id,
            });

            if (input.signatures && input.signatures.length > 0) {
              const baseUrl =
                process.env.APP_URL ||
                process.env.VITE_APP_URL ||
                "http://localhost:3000";
              const docSignatures = input.signatures.map((sigInput) => ({
                ...sigInput,
                verificationToken: crypto.randomBytes(32).toString("hex"),
              }));

              yield* documentQueries.createDocumentSignatures(
                docSignatures.map((sig, index) => ({
                  documentId: document.id,
                  signedByUserId: sig.userId,
                  signerName: sig.userName,
                  purpose: sig.purpose,
                  signatureOrder: index + 1,
                  qrCodePosition: {
                    x: sig.x,
                    y: sig.y,
                    width: sig.width,
                    height: sig.height,
                    page: sig.page,
                  },
                  verificationToken: sig.verificationToken,
                  verificationUrl: `${baseUrl}/verify/${sig.verificationToken}`,
                  signatureData: "JWT-SIGNATURE",
                  fileHash: "HASH",
                })),
              );
            }

            // Generate TTE request token
            const signerEmail =
              company.headOfCompanyEmail || worksheet.order.user.email;

            const tteToken = yield* createTTERequestToken({
              documentId: document.id,
              orderId: worksheet.orderId,
              signerName: company.headOfCompany ?? "Pimpinan",
              signerRole: company.headOfCompanyPosition ?? "Direktur",
              signerEmail: signerEmail ?? "admin@bk3samarinda.kemnaker.go.id",
            });

            // Send TTE request email
            const appUrl =
              process.env.APP_URL ||
              process.env.VITE_APP_URL ||
              "http://localhost:3000";
            const tteLink = `${appUrl}/tte/sign-spk?token=${tteToken}`;

            yield* Effect.tryPromise({
              try: async () => {
                try {
                  await emailService.sendTTERequest({
                    email: signerEmail ?? "admin@bk3samarinda.kemnaker.go.id",
                    signerName: company.headOfCompany ?? "Pimpinan",
                    documentName: document.title,
                    tteLink,
                  });
                } catch (error) {
                  logError("generateSpkDocument", "Failed to send TTE email", {
                    error,
                  });
                }
              },
              catch: (error) =>
                handleTRPCError(
                  error,
                  "Gagal mengirim email TTE",
                  "INTERNAL_SERVER_ERROR",
                ),
            });

            return {
              base64: spkBuffer.toString("base64"),
              filename,
              contentType: "application/pdf",
              message: "SPK berhasil dibuat dan email TTE telah dikirim.",
            };
          }),
        ),
    ),

  generateTagihanDocument: withPermission("documents.create")
    .input(generateDocumentSchema.generateTagihanDocumentSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const worksheet =
              yield* worksheetQueries.getWorksheetTransactionDetail(
                input.worksheetId,
                { unmask: true },
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
                  operationalBankAccount: OPERATIONAL_BANK_ACCOUNT,
                  operationalBankAccountName: OPERATIONAL_BANK_ACCOUNT_NAME,
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

            let tagihanBuffer = Buffer.from(tagihan as Buffer);

            if (input.signatures && input.signatures.length > 0) {
              const baseUrl =
                process.env.APP_URL ||
                process.env.VITE_APP_URL ||
                "http://localhost:3000";
              const docSignatures = [];

              for (const sigInput of input.signatures) {
                const signature = yield* createDocumentSignature(
                  "temp-id",
                  input.letterNumber,
                  "worksheet",
                  input.worksheetId,
                  "invoice",
                  "temp-url",
                  tagihanBuffer,
                  sigInput.userId,
                );

                docSignatures.push({
                  ...sigInput,
                  verificationUrl: `${baseUrl}/verify/${signature.verificationToken}`,
                  signatureData: signature.signatureData,
                  verificationToken: signature.verificationToken,
                  fileHash: signature.fileHash,
                });
              }

              const qrCodeData = docSignatures.map((sig) => ({
                signature: {
                  userId: sig.userId,
                  userName: sig.userName,
                  purpose: sig.purpose,
                  verificationUrl: sig.verificationUrl,
                },
                position: {
                  x: sig.x,
                  y: sig.y,
                  width: sig.width,
                  height: sig.height,
                  page: sig.page,
                },
              }));

              const signedPdf = yield* pdfSigningService.embedQRCodesInPDF(
                tagihanBuffer,
                qrCodeData,
              );
              tagihanBuffer = Buffer.from(signedPdf);

              const filename = `tagihan-${input.letterNumber}.pdf`;
              const uploadedFile = yield* storageService.upload(tagihanBuffer, {
                filename,
                contentType: "application/pdf",
                folder: "documents/worksheet/invoices",
              });

              const documentNumber = `DOC-INVOICE-${input.letterNumber}`;
              const document = yield* documentQueries.createDocument({
                documentNumber,
                type: "invoice",
                title: `Invoice / Tagihan - ${input.letterNumber}`,
                description: `Invoice untuk Worksheet ${input.worksheetId}`,
                entityType: "worksheet",
                entityId: input.worksheetId,
                fileUrl: uploadedFile.key,
                fileName: filename,
                fileSize: tagihanBuffer.length,
                mimeType: "application/pdf",
                uploadedByUserId: ctx.user.id,
              });

              yield* documentQueries.createDocumentSignatures(
                docSignatures.map((sig, index) => ({
                  documentId: document.id,
                  signedByUserId: sig.userId,
                  signerName: sig.userName,
                  purpose: sig.purpose,
                  signatureOrder: index + 1,
                  qrCodePosition: {
                    x: sig.x,
                    y: sig.y,
                    width: sig.width,
                    height: sig.height,
                    page: sig.page,
                  },
                  verificationToken: sig.verificationToken,
                  verificationUrl: sig.verificationUrl,
                  signatureData: sig.signatureData,
                  fileHash: sig.fileHash,
                })),
              );
            }

            return {
              base64: tagihanBuffer.toString("base64"),
              filename: `tagihan-${input.letterNumber}.pdf`,
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  generateAssignmentLetter: withPermission("documents-spt.create")
    .input(generateDocumentSchema.generateAssignmentLetter)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const worksheet =
              yield* worksheetQueries.getWorksheetTransactionDetail(
                input.worksheetId,
                { unmask: true },
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

            const startDate =
              worksheet.startDate ??
              worksheet.order.createdAt ??
              new Date().toISOString();
            const endDate =
              worksheet.endDate ??
              worksheet.order.createdAt ??
              new Date().toISOString();

            const assignees =
              worksheet.assignments && worksheet.assignments.length > 0
                ? worksheet.assignments.map((assignee) => ({
                    ...assignee,
                    employee: {
                      ...assignee.employee,
                      position: assignee.employee.position || null,
                    },
                  }))
                : [];

            const assignmentLetter = yield* Effect.tryPromise({
              try: () =>
                generateAssignmentLetterPdf({
                  companyName: company.name,
                  companyRegency: company.regency?.name ?? "Samarinda",
                  orderDate: worksheet.order.createdAt,
                  assignmentDateStart: startDate,
                  assignmentDateEnd: endDate,
                  letterNumber: input.letterNumber,
                  assignmentLetterNumber: input.assignmentLetterNumber,
                  spkNumber: input.spkNumber,
                  spkDate: input.spkDate,
                  offeringNumber: input.offeringNumber,
                  offeringDate: input.offeringDate,
                  financingSource: worksheet.operationalCosts
                    ? worksheet.operationalCosts
                        .map((cost) => cost.item)
                        .join(", ")
                    : "",
                  assignees,
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

            let sptBuffer = Buffer.from(assignmentLetter as Buffer);

            if (input.signatures && input.signatures.length > 0) {
              const baseUrl =
                process.env.APP_URL ||
                process.env.VITE_APP_URL ||
                "http://localhost:3000";
              const docSignatures = [];

              for (const sigInput of input.signatures) {
                const signature = yield* createDocumentSignature(
                  "temp-id",
                  input.assignmentLetterNumber,
                  "worksheet",
                  input.worksheetId,
                  "assignment_letter",
                  "temp-url",
                  sptBuffer,
                  sigInput.userId,
                );

                docSignatures.push({
                  ...sigInput,
                  verificationUrl: `${baseUrl}/verify/${signature.verificationToken}`,
                  signatureData: signature.signatureData,
                  verificationToken: signature.verificationToken,
                  fileHash: signature.fileHash,
                });
              }

              const qrCodeData = docSignatures.map((sig) => ({
                signature: {
                  userId: sig.userId,
                  userName: sig.userName,
                  purpose: sig.purpose,
                  verificationUrl: sig.verificationUrl,
                },
                position: {
                  x: sig.x,
                  y: sig.y,
                  width: sig.width,
                  height: sig.height,
                  page: sig.page,
                },
              }));

              const signedPdf = yield* pdfSigningService.embedQRCodesInPDF(
                sptBuffer,
                qrCodeData,
              );
              sptBuffer = Buffer.from(signedPdf);

              const filename = `surat-tugas-${input.assignmentLetterNumber}.pdf`;
              const uploadedFile = yield* storageService.upload(sptBuffer, {
                filename,
                contentType: "application/pdf",
                folder: "documents/worksheet/assignment-letters",
              });

              const documentNumber = `DOC-SPT-${input.assignmentLetterNumber}`;
              const document = yield* documentQueries.createDocument({
                documentNumber,
                type: "assignment_letter",
                title: `Surat Tugas - ${input.assignmentLetterNumber}`,
                description: `SPT untuk Worksheet ${input.worksheetId}`,
                entityType: "worksheet",
                entityId: input.worksheetId,
                fileUrl: uploadedFile.key,
                fileName: filename,
                fileSize: sptBuffer.length,
                mimeType: "application/pdf",
                uploadedByUserId: ctx.user.id,
              });

              yield* documentQueries.createDocumentSignatures(
                docSignatures.map((sig, index) => ({
                  documentId: document.id,
                  signedByUserId: sig.userId,
                  signerName: sig.userName,
                  purpose: sig.purpose,
                  signatureOrder: index + 1,
                  qrCodePosition: {
                    x: sig.x,
                    y: sig.y,
                    width: sig.width,
                    height: sig.height,
                    page: sig.page,
                  },
                  verificationToken: sig.verificationToken,
                  verificationUrl: sig.verificationUrl,
                  signatureData: sig.signatureData,
                  fileHash: sig.fileHash,
                })),
              );
            }

            return {
              base64: sptBuffer.toString("base64"),
              filename: `surat-tugas-${input.assignmentLetterNumber}.pdf`,
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  previewOfferingLetter: withPermission("documents.create")
    .input(generateDocumentSchema.generateOfferingLetterDocumentSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const worksheet =
              yield* worksheetQueries.getWorksheetTransactionDetail(
                input.worksheetId,
                { unmask: true },
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
                  adminEmail: input.adminEmail || ADMIN_EMAIL,
                  adminContact: input.adminContact || ADMIN_PHONE,
                  companyRepName: company.headOfCompany,
                  companyRepPosition: company.headOfCompanyPosition,
                }),
              catch: (error) =>
                handleTRPCError(
                  error,
                  "Gagal menghasilkan header surat penawaran",
                  "INTERNAL_SERVER_ERROR",
                ),
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
                  companyRepName: company.headOfCompany,
                  companyRepPosition: company.headOfCompanyPosition,
                }),
              catch: (error) =>
                handleTRPCError(
                  error,
                  "Gagal menghasilkan surat penawaran",
                  "INTERNAL_SERVER_ERROR",
                ),
            });

            const pdfBuffer = Buffer.from(
              (yield* addCoverPage(
                offeringLetterHeader as Buffer,
                offeringLetter as Buffer,
              )) as Buffer,
            );

            return {
              base64: pdfBuffer.toString("base64"),
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  previewSpkDocument: withPermission("documents.create")
    .input(generateDocumentSchema.generateSpkDocumentSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const worksheet =
              yield* worksheetQueries.getWorksheetTransactionDetail(
                input.worksheetId,
                { unmask: true },
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
              catch: (error) =>
                handleTRPCError(
                  error,
                  "Gagal menghasilkan dokumen SPK",
                  "INTERNAL_SERVER_ERROR",
                ),
            });

            return {
              base64: Buffer.from(spk as Buffer).toString("base64"),
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  previewAssignmentLetter: withPermission("documents.create")
    .input(generateDocumentSchema.generateAssignmentLetter)
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const worksheet =
              yield* worksheetQueries.getWorksheetTransactionDetail(
                input.worksheetId,
                { unmask: true },
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

            const startDate =
              worksheet.startDate ??
              worksheet.order.createdAt ??
              new Date().toISOString();
            const endDate =
              worksheet.endDate ??
              worksheet.order.createdAt ??
              new Date().toISOString();

            const assignees =
              worksheet.assignments && worksheet.assignments.length > 0
                ? worksheet.assignments.map((assignee) => ({
                    ...assignee,
                    employee: {
                      ...assignee.employee,
                      position: assignee.employee.position || null,
                    },
                  }))
                : [];

            const assignmentLetter = yield* Effect.tryPromise({
              try: () =>
                generateAssignmentLetterPdf({
                  companyName: company.name,
                  companyRegency: company.regency?.name ?? "Samarinda",
                  orderDate: worksheet.order.createdAt,
                  assignmentDateStart: startDate,
                  assignmentDateEnd: endDate,
                  letterNumber: input.letterNumber,
                  assignmentLetterNumber: input.assignmentLetterNumber,
                  spkNumber: input.spkNumber,
                  spkDate: input.spkDate,
                  offeringNumber: input.offeringNumber,
                  offeringDate: input.offeringDate,
                  financingSource: worksheet.operationalCosts
                    ? worksheet.operationalCosts
                        .map((cost) => cost.item)
                        .join(", ")
                    : "",
                  assignees,
                }),
              catch: (error) =>
                handleTRPCError(
                  error,
                  "Gagal menghasilkan surat tugas",
                  "INTERNAL_SERVER_ERROR",
                ),
            });

            return {
              base64: Buffer.from(assignmentLetter as Buffer).toString(
                "base64",
              ),
              contentType: "application/pdf",
            };
          }),
        ),
    ),

  previewTagihanDocument: withPermission("documents.create")
    .input(generateDocumentSchema.generateTagihanDocumentSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            const worksheet =
              yield* worksheetQueries.getWorksheetTransactionDetail(
                input.worksheetId,
                { unmask: true },
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
                  operationalBankAccount: OPERATIONAL_BANK_ACCOUNT,
                  operationalBankAccountName: OPERATIONAL_BANK_ACCOUNT_NAME,
                }),
              catch: (error) =>
                handleTRPCError(
                  error,
                  "Gagal menghasilkan dokumen tagihan",
                  "INTERNAL_SERVER_ERROR",
                ),
            });

            return {
              base64: Buffer.from(tagihan as Buffer).toString("base64"),
              contentType: "application/pdf",
            };
          }),
        ),
    ),
});
