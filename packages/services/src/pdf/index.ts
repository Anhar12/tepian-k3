// Invoice generator
export { generateInvoicePdf } from "./generator/invoice";

// Offering Letter generator
export { generateOfferingLetterPdf } from "./generator/offering-letter";

// Offering Letter Header generator
export { generateOfferingLetterHeaderPdf } from "./generator/offering-letter-header";

// Assignment Letter generator
export { generateAssignmentLetterPdf } from "./generator/assignment-letter";

// SPK generator
export { generateSpkPdf } from "./generator/spk";

// Tagihan generator
export { generateTagihanPdf } from "./generator/tagihan";

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

// Reusable PDF Components
export { BlankField } from "./components/blank-field";
export { BorderBox } from "./components/border-box";
export { CompanySignature } from "./components/company-signature";
export { Divider } from "./components/divider";
export { DocumentHeader } from "./components/document-header";
export { HeadSignature } from "./components/head-signature";
export { LabeledField } from "./components/labeled-field";
export { Letterhead } from "./components/letterhead";
export { NumberedList } from "./components/numbered-list";
export { QRCodeImage } from "./components/qrcode";
export { SectionHeader } from "./components/section-header";
export { SignatureBlock } from "./components/signature-block";
export { SignatureTable } from "./components/signature-table";
export { Spacer, SpacerSizes } from "./components/spacer";
export { SummaryRow } from "./components/summary-row";
export { Table, type TableColumn } from "./components/table";
export { PricingTable } from "./components/pricing-table";

// Tailwind styling utility
export { tw } from "./utils/tw";
