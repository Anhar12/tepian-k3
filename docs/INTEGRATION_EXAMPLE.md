# QR Code Integration Example

This document shows how to integrate QR codes with the PDF generation and document signing services.

## Overview

The QR code implementation allows you to:
1. Generate QR codes for document verification
2. Embed QR codes in PDF templates (invoices, offering letters, etc.)
3. Link QR codes to the JWT-based document signing system

## Basic Usage

### 1. Generate a QR Code for Document Verification

```typescript
import {
  generateDocumentVerificationQRCode
} from "@tepian-k3/services/pdf";
import {
  createDocumentSignature
} from "@tepian-k3/services/document-signing";
import { Effect } from "effect";

// Example: Generate invoice with QR code
const generateInvoiceWithQRCode = Effect.gen(function* () {
  // 1. Get order data
  const order = yield* getOrderWithCompanyAndItems(orderId);

  // 2. Generate the PDF first (without QR code)
  const pdfBuffer = yield* Effect.tryPromise(() =>
    generateInvoicePdf({
      order,
      invoiceNumber: `INV-${order.orderNumber}`,
      logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
    })
  );

  // 3. Upload PDF to storage
  const uploadedFile = yield* storageService.upload(pdfBuffer, {
    filename: `invoice-${order.orderNumber}.pdf`,
    folder: "invoices",
    contentType: "application/pdf",
  });

  // 4. Create document signature with verification token
  const signature = yield* createDocumentSignature(
    documentId,           // Document ID from database
    `INV-${order.orderNumber}`,  // Document number
    "order",             // Entity type
    order.id,            // Entity ID
    "invoice",           // Document type
    uploadedFile.url,    // File URL
    pdfBuffer,           // File content for hash
    userId               // Signed by user ID
  );

  // 5. Generate QR code with verification URL
  const { qrCodeDataURL, verificationURL } =
    yield* generateDocumentVerificationQRCode(
      signature.verificationToken,
      process.env.DOCUMENT_VERIFICATION_BASE_URL
    );

  // 6. Regenerate PDF with QR code included
  const finalPdfBuffer = yield* Effect.tryPromise(() =>
    generateInvoicePdf({
      order,
      invoiceNumber: `INV-${order.orderNumber}`,
      logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
      qrCodeDataURL,      // Pass the QR code
      verificationURL,    // Pass the verification URL
    })
  );

  // 7. Update the uploaded file with the final version
  yield* storageService.upload(finalPdfBuffer, {
    filename: `invoice-${order.orderNumber}.pdf`,
    folder: "invoices",
    contentType: "application/pdf",
  });

  return {
    documentId,
    verificationToken: signature.verificationToken,
    signatureData: signature.signatureData,
    fileHash: signature.fileHash,
    url: uploadedFile.url,
  };
});
```

## Complete Integration Example in tRPC Router

```typescript
import {
  generateInvoicePdf,
  generateDocumentVerificationQRCode
} from "@tepian-k3/services/pdf";
import {
  createDocumentSignature
} from "@tepian-k3/services/document-signing";
import { storageService } from "@tepian-k3/services/storage";
import { Effect } from "effect";

export const orderRouter = createTRPCRouter({
  generateInvoiceWithQRCode: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) =>
      runEffect(
        Effect.gen(function* () {
          // Get order with full details
          const order = yield* orderQueries.getOrderWithCompanyAndItems(
            input.orderId,
            ctx.user.id
          );

          if (!order) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Order tidak ditemukan",
            });
          }

          const invoiceNumber = `INV-${order.orderNumber}`;
          const filename = `invoice-${order.orderNumber}.pdf`;

          // Generate initial PDF (without QR code)
          const initialPdfBuffer = yield* Effect.tryPromise({
            try: () =>
              generateInvoicePdf({
                order,
                invoiceNumber,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
                logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
              }),
            catch: (error) =>
              new Error(`Failed to generate PDF: ${String(error)}`),
          });

          // Upload initial PDF
          const uploadedFile = yield* storageService.upload(
            initialPdfBuffer as Buffer,
            {
              filename,
              folder: "invoices",
              contentType: "application/pdf",
            }
          );

          // Create document record in database
          const document = yield* documentQueries.createDocument({
            documentNumber: invoiceNumber,
            entityType: "order",
            entityId: order.id,
            type: "invoice",
            fileUrl: uploadedFile.url,
            fileKey: uploadedFile.key,
          });

          // Create document signature
          const signature = yield* createDocumentSignature(
            document.id,
            invoiceNumber,
            "order",
            order.id,
            "invoice",
            uploadedFile.url,
            initialPdfBuffer as Buffer,
            ctx.user.id
          );

          // Store signature in database
          yield* documentQueries.updateDocumentSignature(document.id, {
            signatureData: signature.signatureData,
            verificationToken: signature.verificationToken,
            fileHash: signature.fileHash,
          });

          // Generate QR code
          const { qrCodeDataURL, verificationURL } =
            yield* generateDocumentVerificationQRCode(
              signature.verificationToken,
              process.env.DOCUMENT_VERIFICATION_BASE_URL
            );

          // Regenerate PDF with QR code
          const finalPdfBuffer = yield* Effect.tryPromise({
            try: () =>
              generateInvoicePdf({
                order,
                invoiceNumber,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
                logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
                qrCodeDataURL,
                verificationURL,
              }),
            catch: (error) =>
              new Error(`Failed to regenerate PDF with QR: ${String(error)}`),
          });

          // Update uploaded file with final PDF
          yield* storageService.upload(finalPdfBuffer as Buffer, {
            filename,
            folder: "invoices",
            contentType: "application/pdf",
          });

          return {
            documentId: document.id,
            url: storageService.getPublicUrl(uploadedFile.key),
            verificationURL,
          };
        })
      )
    ),
});
```

## Offering Letter Example

```typescript
generateOfferingLetterWithQRCode: protectedProcedure
  .input(
    z.object({
      orderId: z.string(),
      letterNumber: z.string(),
      referenceNumber: z.string(),
      referenceDate: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const order = yield* orderQueries.getOrderWithCompanyAndItems(
          input.orderId,
          ctx.user.id
        );

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order tidak ditemukan",
          });
        }

        const filename = `offering-letter-${order.orderNumber}.pdf`;

        // Generate initial PDF
        const initialPdfBuffer = yield* Effect.tryPromise(() =>
          generateOfferingLetterPdf({
            order,
            letterNumber: input.letterNumber,
            referenceNumber: input.referenceNumber,
            referenceDate: input.referenceDate,
            adminEmail: "admin@balaik3samarinda.kemnaker.go.id",
            adminContact: "+62 812-3456-7890",
            logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
          })
        );

        // Upload initial PDF
        const uploadedFile = yield* storageService.upload(
          initialPdfBuffer as Buffer,
          {
            filename,
            folder: "offering-letters",
            contentType: "application/pdf",
          }
        );

        // Create document record
        const document = yield* documentQueries.createDocument({
          documentNumber: input.letterNumber,
          entityType: "order",
          entityId: order.id,
          type: "offering_document",
          fileUrl: uploadedFile.url,
          fileKey: uploadedFile.key,
        });

        // Create signature
        const signature = yield* createDocumentSignature(
          document.id,
          input.letterNumber,
          "order",
          order.id,
          "offering_document",
          uploadedFile.url,
          initialPdfBuffer as Buffer,
          ctx.user.id
        );

        // Store signature
        yield* documentQueries.updateDocumentSignature(document.id, {
          signatureData: signature.signatureData,
          verificationToken: signature.verificationToken,
          fileHash: signature.fileHash,
        });

        // Generate QR code
        const { qrCodeDataURL, verificationURL } =
          yield* generateDocumentVerificationQRCode(
            signature.verificationToken
          );

        // Regenerate with QR code
        const finalPdfBuffer = yield* Effect.tryPromise(() =>
          generateOfferingLetterPdf({
            order,
            letterNumber: input.letterNumber,
            referenceNumber: input.referenceNumber,
            referenceDate: input.referenceDate,
            adminEmail: "admin@balaik3samarinda.kemnaker.go.id",
            adminContact: "+62 812-3456-7890",
            logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
            qrCodeDataURL,
            verificationURL,
          })
        );

        // Update file
        yield* storageService.upload(finalPdfBuffer as Buffer, {
          filename,
          folder: "offering-letters",
          contentType: "application/pdf",
        });

        return {
          documentId: document.id,
          url: storageService.getPublicUrl(uploadedFile.key),
          verificationURL,
        };
      })
    )
  ),
```

## Environment Variables Required

Add these to your `.env` file:

```env
# Document verification base URL (where users will be redirected when scanning QR)
DOCUMENT_VERIFICATION_BASE_URL=https://yourdomain.com/verify

# JWT secrets for document signing (already configured)
JWT_DOCUMENT_SECRET=your-secret-key-min-32-chars
JWT_LEGAL_DOCUMENT_SECRET=your-legal-secret-key-min-32-chars
JWT_TESTING_DOCUMENT_SECRET=your-testing-secret-key-min-32-chars
JWT_COMPANY_DOCUMENT_SECRET=your-company-secret-key-min-32-chars
```

## QR Code Verification Flow

1. User generates document (invoice/offering letter)
2. System creates JWT signature with document metadata
3. System generates verification token (secure random string)
4. QR code is created with URL: `${BASE_URL}/verify/${verificationToken}`
5. QR code is embedded in PDF
6. When scanned, user is directed to verification page
7. Verification page:
   - Looks up document by verification token
   - Verifies JWT signature
   - Checks file integrity (hash comparison)
   - Shows verification status and document details

## API Utilities

All QR code utilities are exported from `@tepian-k3/services/pdf`:

```typescript
import {
  // Generate QR code as data URL (for PDF embedding)
  generateQRCodeDataURL,

  // Generate QR code as Buffer (for file storage)
  generateQRCodeBuffer,

  // Generate verification URL
  generateVerificationURL,

  // Generate QR code with verification URL (convenience function)
  generateDocumentVerificationQRCode,

  // PDF generators (now support QR codes)
  generateInvoicePdf,
  generateOfferingLetterPdf,
} from "@tepian-k3/services/pdf";
```

## Customizing QR Code Appearance

You can customize the QR code by passing options to `generateQRCodeDataURL`:

```typescript
const { qrCodeDataURL } = yield* generateDocumentVerificationQRCode(
  verificationToken,
  baseUrl,
  {
    width: 150,           // Custom width in pixels
    margin: 2,            // Margin around QR code
    color: {
      dark: "#000000",    // QR code color
      light: "#FFFFFF",   // Background color
    },
    errorCorrectionLevel: "H", // L, M, Q, or H
  }
);
```

## Notes

- QR codes are generated as data URLs (base64 encoded PNG images)
- They can be directly embedded in `@react-pdf/renderer` Image components
- High error correction level (H) is used by default for better scanning reliability
- The verification token is stored in the database alongside the JWT signature
- QR codes are positioned at the bottom of documents, before the footer
