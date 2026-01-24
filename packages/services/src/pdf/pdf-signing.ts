import { Effect } from "effect";
import { PDFDocument, rgb } from "pdf-lib";
import * as QRCode from "qrcode";
import { TRPCError } from "@trpc/server";

export interface QRCodePosition {
  x: number; // X coordinate in PDF points (1 point = 1/72 inch)
  y: number; // Y coordinate in PDF points (from bottom-left)
  width: number; // Width in points
  height: number; // Height in points
  page: number; // Page number (0-indexed)
}

export interface SignatureData {
  userId: string;
  userName: string;
  purpose: string;
  verificationUrl: string; // URL that the QR code will point to
}

/**
 * Generate QR code as PNG buffer
 */
export const generateQRCodeBuffer = (data: string, size = 200) =>
  Effect.tryPromise({
    try: async () => {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: "H", // High error correction
        width: size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Convert data URL to buffer
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
      return Buffer.from(base64Data, "base64");
    },
    catch: (error) =>
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate QR code",
        cause: error,
      }),
  });

/**
 * Embed multiple QR codes into a PDF document
 */
export const embedQRCodesInPDF = (
  pdfBuffer: Buffer,
  qrCodes: Array<{ signature: SignatureData; position: QRCodePosition }>
) =>
  Effect.gen(function* () {
    // Load the PDF document
    const pdfDoc = yield* Effect.tryPromise({
      try: () => PDFDocument.load(pdfBuffer),
      catch: (error) =>
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to load PDF document",
          cause: error,
        }),
    });

    const pages = pdfDoc.getPages();

    // Process each QR code
    for (const qrCodeData of qrCodes) {
      const { signature, position } = qrCodeData;

      // Validate page number
      if (position.page < 0 || position.page >= pages.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid page number: ${position.page}. Document has ${pages.length} pages.`,
        });
      }

      // Generate QR code as PNG buffer
      const qrCodeBuffer = yield* generateQRCodeBuffer(
        signature.verificationUrl,
        Math.max(position.width, position.height)
      );

      // Embed QR code image in PDF
      const qrImage = yield* Effect.tryPromise({
        try: () => pdfDoc.embedPng(qrCodeBuffer),
        catch: (error) =>
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to embed QR code in PDF",
            cause: error,
          }),
      });

      const page = pages[position.page];

      if (!page) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Page number ${position.page} does not exist in the PDF.`,
        });
      }

      const pageHeight = page.getHeight();

      // PDF coordinates are from bottom-left, but our input is from top-left
      // Convert Y coordinate from top-left to bottom-left
      const yFromBottom = pageHeight - position.y - position.height;

      // Draw QR code on the page
      page.drawImage(qrImage, {
        x: position.x,
        y: yFromBottom,
        width: position.width,
        height: position.height,
      });

      // Optionally add signature text below QR code
      const fontSize = 8;
      const textY = yFromBottom - 12;

      if (textY > 0) {
        // Only draw text if there's space
        page.drawText(`Signed by: ${signature.userName}`, {
          x: position.x,
          y: textY,
          size: fontSize,
          color: rgb(0, 0, 0),
        });

        page.drawText(`Purpose: ${signature.purpose.substring(0, 40)}`, {
          x: position.x,
          y: textY - fontSize - 2,
          size: fontSize - 1,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    }

    // Save the modified PDF
    const modifiedPdfBytes = yield* Effect.tryPromise({
      try: () => pdfDoc.save(),
      catch: (error) =>
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save modified PDF",
          cause: error,
        }),
    });

    return Buffer.from(modifiedPdfBytes);
  });

/**
 * Simple helper to embed a single QR code
 */
export const embedSingleQRCodeInPDF = (
  pdfBuffer: Buffer,
  signature: SignatureData,
  position: QRCodePosition
) => embedQRCodesInPDF(pdfBuffer, [{ signature, position }]);

/**
 * Convert client coordinates (from PDF editor) to PDF points
 * Client coordinates assume a standard A4-like canvas (800x1100 pixels)
 * PDF uses points (1 point = 1/72 inch)
 */
export const convertClientCoordinatesToPDFPoints = (
  clientX: number,
  clientY: number,
  clientWidth: number,
  clientHeight: number,
  pageNumber: number,
  pdfBuffer: Buffer
) =>
  Effect.gen(function* () {
    const pdfDoc = yield* Effect.tryPromise({
      try: () => PDFDocument.load(pdfBuffer),
      catch: (error) =>
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to load PDF document",
          cause: error,
        }),
    });

    const pages = pdfDoc.getPages();
    if (pageNumber < 0 || pageNumber >= pages.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid page number: ${pageNumber}`,
      });
    }

    const page = pages[pageNumber];

    if (!page) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Page number ${pageNumber} does not exist in the PDF.`,
      });
    }

    const { width: pdfWidth, height: pdfHeight } = page.getSize();

    // Standard client canvas dimensions
    const CLIENT_CANVAS_WIDTH = 800;
    const CLIENT_CANVAS_HEIGHT = 1100;

    // Scale factors
    const scaleX = pdfWidth / CLIENT_CANVAS_WIDTH;
    const scaleY = pdfHeight / CLIENT_CANVAS_HEIGHT;

    // Convert coordinates
    const position: QRCodePosition = {
      x: clientX * scaleX,
      y: clientY * scaleY,
      width: clientWidth * scaleX,
      height: clientHeight * scaleY,
      page: pageNumber,
    };

    return position;
  });

export const pdfSigningService = {
  generateQRCodeBuffer,
  embedQRCodesInPDF,
  embedSingleQRCodeInPDF,
  convertClientCoordinatesToPDFPoints,
};
