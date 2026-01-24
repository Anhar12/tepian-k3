// Client-side PDF modification services
export {
  PDFModifierService,
  loadPDF,
  addQRCodeToPDF,
  addTextToPDF,
  addImageToPDF,
  modifyPDF,
  savePDF,
  getPDFAsBase64,
  getPDFAsBlob,
  getPageCount,
  getPageDimensions,
  extractPages,
  mergePDFs,
  type QRCodePosition,
  type PDFModificationOptions,
} from "./client/pdf-modifier";

// Client-side QR Code generation
export {
  QRCodeGeneratorService,
  generateQRCodeDataURL as generateClientQRCodeDataURL,
  generateQRCodeCanvas,
  generateVerificationQRCode,
  generateBrandedQRCode,
  validateQRCodeTextLength,
  generateQRCodeBatch,
  downloadQRCode,
  type QRCodeOptions,
} from "./client/qrcode-generator";
