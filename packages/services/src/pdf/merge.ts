import { PDFDocument } from "pdf-lib";
import { Effect } from "effect";

export class PdfMergeError {
  readonly _tag = "PdfMergeError";
  constructor(
    readonly message: string,
    readonly cause?: unknown,
  ) {}
}

/**
 * Merges multiple PDF buffers into a single PDF
 * @param pdfBuffers - Array of PDF buffers to merge
 * @returns Effect that resolves to merged PDF buffer
 */
export const mergePdfs = (
  pdfBuffers: Buffer[],
): Effect.Effect<Buffer, PdfMergeError> =>
  Effect.tryPromise({
    try: async () => {
      if (pdfBuffers.length === 0) {
        throw new Error("No PDF buffers provided");
      }

      if (pdfBuffers.length === 1) {
        return pdfBuffers[0]!;
      }

      const mergedDoc = await PDFDocument.create();

      for (const buffer of pdfBuffers) {
        const pdf = await PDFDocument.load(buffer);
        const pages = await mergedDoc.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedDoc.addPage(page));
      }

      const mergedPdfBytes = await mergedDoc.save();
      return Buffer.from(mergedPdfBytes);
    },
    catch: (error) =>
      new PdfMergeError(
        "Failed to merge PDFs",
        error instanceof Error ? error : undefined,
      ),
  });

/**
 * Merges two PDF buffers into one
 * @param pdf1 - First PDF buffer
 * @param pdf2 - Second PDF buffer
 * @returns Effect that resolves to merged PDF buffer
 */
export const mergeTwoPdfs = (
  pdf1: Buffer,
  pdf2: Buffer,
): Effect.Effect<Buffer, PdfMergeError> => mergePdfs([pdf1, pdf2]);

/**
 * Adds a cover page to an existing PDF
 * @param coverPage - Cover page PDF buffer
 * @param mainDocument - Main document PDF buffer
 * @returns Effect that resolves to merged PDF buffer
 */
export const addCoverPage = (
  coverPage: Buffer,
  mainDocument: Buffer,
): Effect.Effect<Buffer, PdfMergeError> => mergePdfs([coverPage, mainDocument]);
