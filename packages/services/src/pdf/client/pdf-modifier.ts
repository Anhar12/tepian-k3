/**
 * PDF Modification Service for Client-Side (Browser)
 *
 * This service uses pdf-lib to modify PDFs in the browser, including:
 * - Adding QR codes to existing PDFs
 * - Positioning QR codes via drag-and-drop
 * - Extracting pages
 * - Merging PDFs
 * - Adding text/images to PDFs
 */

import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';

export interface QRCodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface PDFModificationOptions {
  qrCode?: {
    dataUrl: string;
    position: QRCodePosition;
  };
  text?: {
    content: string;
    x: number;
    y: number;
    size?: number;
    color?: { r: number; g: number; b: number };
    page: number;
  }[];
  images?: {
    dataUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  }[];
}

export class PDFModifierService {
  /**
   * Load PDF from file or URL
   */
  static async loadPDF(source: File | ArrayBuffer | Uint8Array): Promise<PDFDocument> {
    try {
      if (source instanceof File) {
        const arrayBuffer = await source.arrayBuffer();
        return await PDFDocument.load(arrayBuffer);
      }
      return await PDFDocument.load(source);
    } catch (error) {
      throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add QR code to PDF at specified position
   */
  static async addQRCodeToPDF(
    pdfDoc: PDFDocument,
    qrCodeDataUrl: string,
    position: QRCodePosition
  ): Promise<PDFDocument> {
    try {
      // Get the page
      const pages = pdfDoc.getPages();
      const page = pages[position.page];

      if (!page) {
        throw new Error(`Page ${position.page} not found`);
      }

      // Embed the QR code image
      let qrImage;
      if (qrCodeDataUrl.startsWith('data:image/png')) {
        qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
      } else if (qrCodeDataUrl.startsWith('data:image/jpeg') || qrCodeDataUrl.startsWith('data:image/jpg')) {
        qrImage = await pdfDoc.embedJpg(qrCodeDataUrl);
      } else {
        throw new Error('QR code must be PNG or JPEG format');
      }

      // Get page dimensions
      const { height: pageHeight } = page.getSize();

      // Convert coordinates (PDF uses bottom-left origin, UI uses top-left)
      const pdfY = pageHeight - position.y - position.height;

      // Draw the QR code
      page.drawImage(qrImage, {
        x: position.x,
        y: pdfY,
        width: position.width,
        height: position.height,
      });

      return pdfDoc;
    } catch (error) {
      throw new Error(`Failed to add QR code to PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add text to PDF at specified position
   */
  static async addTextToPDF(
    pdfDoc: PDFDocument,
    text: string,
    x: number,
    y: number,
    pageIndex: number,
    options?: {
      size?: number;
      color?: { r: number; g: number; b: number };
      rotation?: number;
    }
  ): Promise<PDFDocument> {
    try {
      const pages = pdfDoc.getPages();
      const page = pages[pageIndex];

      if (!page) {
        throw new Error(`Page ${pageIndex} not found`);
      }

      const { height: pageHeight } = page.getSize();
      const pdfY = pageHeight - y;

      page.drawText(text, {
        x,
        y: pdfY,
        size: options?.size ?? 12,
        color: options?.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0, 0, 0),
        rotate: options?.rotation ? degrees(options.rotation) : undefined,
      });

      return pdfDoc;
    } catch (error) {
      throw new Error(`Failed to add text to PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add image to PDF at specified position
   */
  static async addImageToPDF(
    pdfDoc: PDFDocument,
    imageDataUrl: string,
    x: number,
    y: number,
    width: number,
    height: number,
    pageIndex: number
  ): Promise<PDFDocument> {
    try {
      const pages = pdfDoc.getPages();
      const page = pages[pageIndex];

      if (!page) {
        throw new Error(`Page ${pageIndex} not found`);
      }

      let image;
      if (imageDataUrl.startsWith('data:image/png')) {
        image = await pdfDoc.embedPng(imageDataUrl);
      } else if (imageDataUrl.startsWith('data:image/jpeg') || imageDataUrl.startsWith('data:image/jpg')) {
        image = await pdfDoc.embedJpg(imageDataUrl);
      } else {
        throw new Error('Image must be PNG or JPEG format');
      }

      const { height: pageHeight } = page.getSize();
      const pdfY = pageHeight - y - height;

      page.drawImage(image, {
        x,
        y: pdfY,
        width,
        height,
      });

      return pdfDoc;
    } catch (error) {
      throw new Error(`Failed to add image to PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Modify PDF with multiple operations
   */
  static async modifyPDF(
    source: File | ArrayBuffer | Uint8Array,
    options: PDFModificationOptions
  ): Promise<PDFDocument> {
    let pdfDoc = await this.loadPDF(source);

    // Add QR code if provided
    if (options.qrCode) {
      pdfDoc = await this.addQRCodeToPDF(
        pdfDoc,
        options.qrCode.dataUrl,
        options.qrCode.position
      );
    }

    // Add text if provided
    if (options.text) {
      for (const textItem of options.text) {
        pdfDoc = await this.addTextToPDF(
          pdfDoc,
          textItem.content,
          textItem.x,
          textItem.y,
          textItem.page,
          {
            size: textItem.size,
            color: textItem.color,
          }
        );
      }
    }

    // Add images if provided
    if (options.images) {
      for (const imageItem of options.images) {
        pdfDoc = await this.addImageToPDF(
          pdfDoc,
          imageItem.dataUrl,
          imageItem.x,
          imageItem.y,
          imageItem.width,
          imageItem.height,
          imageItem.page
        );
      }
    }

    return pdfDoc;
  }

  /**
   * Save modified PDF
   */
  static async savePDF(pdfDoc: PDFDocument, filename: string): Promise<void> {
    try {
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, filename);
    } catch (error) {
      throw new Error(`Failed to save PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get PDF as base64 string
   */
  static async getPDFAsBase64(pdfDoc: PDFDocument): Promise<string> {
    try {
      const pdfBytes = await pdfDoc.save();
      const base64 = Buffer.from(pdfBytes).toString('base64');
      return `data:application/pdf;base64,${base64}`;
    } catch (error) {
      throw new Error(`Failed to get PDF as base64: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get PDF as Blob
   */
  static async getPDFAsBlob(pdfDoc: PDFDocument): Promise<Blob> {
    try {
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      throw new Error(`Failed to get PDF as blob: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get PDF page count
   */
  static getPageCount(pdfDoc: PDFDocument): number {
    return pdfDoc.getPageCount();
  }

  /**
   * Get page dimensions
   */
  static getPageDimensions(pdfDoc: PDFDocument, pageIndex: number): { width: number; height: number } {
    const pages = pdfDoc.getPages();
    const page = pages[pageIndex];

    if (!page) {
      throw new Error(`Page ${pageIndex} not found`);
    }

    return page.getSize();
  }

  /**
   * Extract specific pages from PDF
   */
  static async extractPages(
    source: File | ArrayBuffer | Uint8Array,
    pageIndices: number[]
  ): Promise<PDFDocument> {
    try {
      const srcDoc = await this.loadPDF(source);
      const newDoc = await PDFDocument.create();

      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page) => {
        newDoc.addPage(page);
      });

      return newDoc;
    } catch (error) {
      throw new Error(`Failed to extract pages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Merge multiple PDFs
   */
  static async mergePDFs(sources: (File | ArrayBuffer | Uint8Array)[]): Promise<PDFDocument> {
    try {
      const mergedDoc = await PDFDocument.create();

      for (const source of sources) {
        const srcDoc = await this.loadPDF(source);
        const pageCount = srcDoc.getPageCount();
        const pageIndices = Array.from({ length: pageCount }, (_, i) => i);

        const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach((page) => {
          mergedDoc.addPage(page);
        });
      }

      return mergedDoc;
    } catch (error) {
      throw new Error(`Failed to merge PDFs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render PDF page as image data URL
   */
  static async renderPageAsImage(
    pdfDoc: PDFDocument,
    pageIndex: number,
    scale: number = 1
  ): Promise<string> {
    try {
      const page = pdfDoc.getPages()[pageIndex];
      if (!page) {
        throw new Error(`Page ${pageIndex} not found`);
      }

      // Create a temporary PDF with just this page
      const tempDoc = await PDFDocument.create();
      const [copiedPage] = await tempDoc.copyPages(pdfDoc, [pageIndex]);
      tempDoc.addPage(copiedPage);

      // Get PDF bytes
      const pdfBytes = await tempDoc.save();

      // Convert to base64
      const base64 = Buffer.from(pdfBytes).toString('base64');
      return `data:application/pdf;base64,${base64}`;
    } catch (error) {
      throw new Error(`Failed to render page as image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export convenience functions
export const loadPDF = PDFModifierService.loadPDF.bind(PDFModifierService);
export const addQRCodeToPDF = PDFModifierService.addQRCodeToPDF.bind(PDFModifierService);
export const addTextToPDF = PDFModifierService.addTextToPDF.bind(PDFModifierService);
export const addImageToPDF = PDFModifierService.addImageToPDF.bind(PDFModifierService);
export const modifyPDF = PDFModifierService.modifyPDF.bind(PDFModifierService);
export const savePDF = PDFModifierService.savePDF.bind(PDFModifierService);
export const getPDFAsBase64 = PDFModifierService.getPDFAsBase64.bind(PDFModifierService);
export const getPDFAsBlob = PDFModifierService.getPDFAsBlob.bind(PDFModifierService);
export const getPageCount = PDFModifierService.getPageCount.bind(PDFModifierService);
export const getPageDimensions = PDFModifierService.getPageDimensions.bind(PDFModifierService);
export const extractPages = PDFModifierService.extractPages.bind(PDFModifierService);
export const mergePDFs = PDFModifierService.mergePDFs.bind(PDFModifierService);
