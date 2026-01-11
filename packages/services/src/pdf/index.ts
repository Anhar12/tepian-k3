// Invoice generator
export { generateInvoicePdf } from "./generator/invoice";

// Offering Letter generator
export { generateOfferingLetterPdf } from "./generator/offering-letter";

// QR Code utilities (server-side)
export {
  generateQRCodeDataURL,
  generateQRCodeBuffer,
  generateVerificationURL,
  generateDocumentVerificationQRCode,
} from "./utils/qrcode";

// PDF Signing with QR Codes
export {
  pdfSigningService,
  type QRCodePosition,
  type SignatureData,
} from "./pdf-signing";
