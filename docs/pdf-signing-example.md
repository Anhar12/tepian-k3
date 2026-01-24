# PDF Signing with QR Codes

This document explains how to use the `signDocumentWithQRCodes` endpoint to sign PDF documents with embedded QR codes.

## Overview

The PDF signing feature allows you to:
1. Upload a PDF document
2. Add multiple QR code signatures at specific positions
3. Each QR code contains verification information and links to a verification URL
4. The signed PDF is stored with all QR codes embedded

## API Endpoint

### `signDocumentWithQRCodes`

**Endpoint:** `documentRouter.signDocumentWithQRCodes`

**Permission Required:** `document-signature.create`

**Input Schema:**

```typescript
{
  entityId: string (UUID v7),
  entityType: "order" | "testing" | "company" | "user",
  type: DocumentType (e.g., "invoice", "contract", "report"),
  title: string (1-255 characters),
  file: File (PDF),
  qrCodes: Array<{
    userId: string (UUID v7),
    userName: string,
    purpose: string,
    position: {
      x: number,        // X coordinate (0-800 for standard canvas)
      y: number,        // Y coordinate (0-1100 for standard canvas)
      width: number,    // Width in pixels
      height: number,   // Height in pixels
      page: number      // Page number (0-indexed)
    }
  }>
}
```

## Frontend Integration Example

Here's how to integrate with the PDF QR Code Editor component:

```typescript
// In your component
import { api } from "@/trpc/react";

function PDFSigningComponent() {
  const signDocument = api.document.signDocumentWithQRCodes.useMutation();

  const handleSavePDF = async (
    pdfFile: File,
    qrElements: QRCodeElement[],
    entityId: string,
    entityType: "order" | "testing",
    documentType: DocumentType,
    title: string
  ) => {
    try {
      // Prepare QR codes data
      const qrCodes = qrElements.map(qr => ({
        userId: qr.userId,
        userName: qr.userName,
        purpose: qr.purpose,
        position: {
          x: qr.x,
          y: qr.y,
          width: qr.width,
          height: qr.height,
          page: qr.page,
        },
      }));

      // Call the API
      const result = await signDocument.mutateAsync({
        entityId,
        entityType,
        type: documentType,
        title,
        file: pdfFile,
        qrCodes,
      });

      console.log("Document signed successfully:", result);
      console.log("Document ID:", result.document.id);
      console.log("Signatures:", result.signatures);

      return result;
    } catch (error) {
      console.error("Failed to sign document:", error);
      throw error;
    }
  };

  return (
    // Your component JSX
  );
}
```

## How It Works

### 1. PDF Signing Service

The service uses `pdf-lib` to manipulate PDF documents:

```typescript
import { pdfSigningService } from "@tepian-k3/services/pdf";

// Embed QR codes into a PDF
const signedPdf = await pdfSigningService.embedQRCodesInPDF(
  pdfBuffer,
  qrCodeData
);
```

### 2. QR Code Generation

Each QR code contains:
- User ID and name
- Purpose of signing
- Verification URL
- Timestamp

The QR code links to: `{APP_URL}/verify/{verificationToken}`

### 3. Document Storage

The workflow:
1. Original PDF is received
2. Document signatures are created (JWT-based)
3. QR codes are generated with verification URLs
4. QR codes are embedded into the PDF using pdf-lib
5. Signed PDF is uploaded to storage
6. Document record is created in the database

## Coordinate System

The PDF editor uses a standard coordinate system:
- Canvas size: 800x1100 pixels (A4-like aspect ratio)
- Origin (0,0) is at the **top-left** corner
- Coordinates are automatically converted to PDF points (1 point = 1/72 inch)

Example QR code position:
```typescript
{
  x: 50,      // 50 pixels from left
  y: 50,      // 50 pixels from top
  width: 100, // 100 pixels wide
  height: 100, // 100 pixels tall
  page: 0     // First page
}
```

## Response

The endpoint returns:

```typescript
{
  document: {
    id: string,
    documentNumber: string,
    type: string,
    title: string,
    entityType: string,
    entityId: string,
    fileUrl: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    uploadedByUserId: string,
    // ... other document fields
  },
  signatures: Array<{
    userId: string,
    userName: string,
    purpose: string,
    verificationUrl: string
  }>
}
```

## Error Handling

The endpoint will throw errors for:
- Invalid PDF file
- Invalid page numbers
- Missing permissions
- Storage upload failures
- Invalid QR code positions

Example error handling:

```typescript
try {
  const result = await signDocument.mutateAsync(data);
} catch (error) {
  if (error.code === "BAD_REQUEST") {
    // Handle invalid input
  } else if (error.code === "FORBIDDEN") {
    // Handle permission error
  } else {
    // Handle other errors
  }
}
```

## Security

- All documents are signed with JWT tokens
- File integrity is verified using SHA-256 hashes
- Verification URLs are unique and secure
- Access control is enforced through permissions

## TODO

- [ ] Store document signatures in a database table
- [ ] Add API endpoint to retrieve signature details
- [ ] Implement signature verification on document view
- [ ] Add support for signature date/time display on PDF
- [ ] Implement signature audit trail
