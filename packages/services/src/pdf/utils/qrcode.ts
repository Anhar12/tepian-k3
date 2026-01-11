import QRCode from "qrcode";
import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { env } from "../../../env";

/**
 * Generate a QR code as a data URL (base64 encoded PNG)
 * This format can be used directly in @react-pdf/renderer Image components
 */
export const generateQRCodeDataURL = (
  data: string,
  options?: QRCode.QRCodeToDataURLOptions
) =>
  Effect.tryPromise({
    try: () =>
      QRCode.toDataURL(data, {
        errorCorrectionLevel: "H", // High error correction for better scanning
        type: "image/png",
        width: 200, // Default width in pixels
        margin: 1, // Minimal margin for compact display
        ...options,
      }),
    catch: (error) =>
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate QR code",
        cause: error,
      }),
  });

/**
 * Generate a QR code as a Buffer (PNG format)
 * Useful for storing QR codes as files
 */
export const generateQRCodeBuffer = (
  data: string,
  options?: QRCode.QRCodeToBufferOptions
) =>
  Effect.tryPromise({
    try: () =>
      QRCode.toBuffer(data, {
        errorCorrectionLevel: "H",
        type: "png",
        width: 200,
        margin: 1,
        ...options,
      }),
    catch: (error) =>
      new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate QR code buffer",
        cause: error,
      }),
  });

/**
 * Generate a verification URL with the verification token
 * This URL will be encoded in the QR code
 */
export const generateVerificationURL = (
  verificationToken: string,
  baseUrl?: string
): string => {
  const base = baseUrl || env.DOCUMENT_VERIFICATION_BASE_URL || "";
  return `${base}?token=${verificationToken}`;
};

/**
 * Generate a QR code data URL for document verification
 * Combines verification URL generation and QR code generation
 */
export const generateDocumentVerificationQRCode = (
  verificationToken: string,
  baseUrl?: string,
  options?: QRCode.QRCodeToDataURLOptions
) =>
  Effect.gen(function* () {
    const verificationURL = generateVerificationURL(verificationToken, baseUrl);
    const qrCodeDataURL = yield* generateQRCodeDataURL(
      verificationURL,
      options
    );
    return {
      qrCodeDataURL,
      verificationURL,
    };
  });
