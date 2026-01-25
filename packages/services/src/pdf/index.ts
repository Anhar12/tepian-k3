// Invoice generator
export { generateInvoicePdf } from "./generator/invoice";

// Offering Letter generator
export { generateOfferingLetterPdf } from "./generator/offering-letter";

// Offering Letter Header generator
export { generateOfferingLetterHeaderPdf } from "./generator/offering-letter-header";

// Assignment Letter generator
export { generateAssignmentLetterPdf } from "./generator/assignment-letter";

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

// PDF Merging utilities
export { mergePdfs, mergeTwoPdfs, addCoverPage } from "./merge";
