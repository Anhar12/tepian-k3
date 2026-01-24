# Document Signatures Implementation

This document provides a complete overview of the document signatures feature implementation.

## Overview

The document signatures feature allows multiple users to sign PDF documents with embedded QR codes. Each QR code contains verification information and can be scanned to verify the signature's authenticity.

## Database Schema

### Table: `document_signatures`

```sql
CREATE TABLE "document_signatures" (
  "id" uuid PRIMARY KEY NOT NULL,
  "document_id" uuid NOT NULL,
  "signed_by_user_id" uuid NOT NULL,
  "signer_name" varchar(255) NOT NULL,
  "signer_email" varchar(255),
  "purpose" text NOT NULL,
  "signature_order" integer,
  "qr_code_position" jsonb NOT NULL,
  "verification_token" varchar(255) NOT NULL UNIQUE,
  "verification_url" text NOT NULL,
  "signature_data" text NOT NULL,
  "file_hash" varchar(64) NOT NULL,
  "signed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone
);
```

### Indexes

- `document_signatures_document_id_idx`: Fast lookup by document
- `document_signatures_signed_by_idx`: Fast lookup by signer
- `document_signatures_verification_token_idx`: Fast lookup for verification
- `document_signatures_created_at_idx`: Chronological ordering

### Relations

- **document**: Many-to-one relationship with `documents` table (cascade delete)
- **signedBy**: Many-to-one relationship with `users` table

## Files Modified/Created

### 1. Database Schema ([schema.ts:930-994](f:/Monorepo/tepian-k3/packages/db/src/schema.ts#L930-L994))

Added `documentSignatures` table definition with all necessary columns and indexes.

### 2. Database Relations ([relations.ts:7,327,365-377](f:/Monorepo/tepian-k3/packages/db/src/relations.ts))

- Added import for `documentSignatures`
- Added `signatures: many(documentSignatures)` to `documentsRelations`
- Created `documentSignaturesRelations` with document and signedBy relations

### 3. Database Migration ([0006_equal_green_goblin.sql](f:/Monorepo/tepian-k3/packages/db/src/migrations/0006_equal_green_goblin.sql))

Generated migration file that creates the `document_signatures` table with all constraints and indexes.

### 4. Document Queries ([document.queries.ts:778-985](f:/Monorepo/tepian-k3/packages/queries/src/document.queries.ts#L778-L985))

Added the following query functions:

- **`createDocumentSignature`**: Create a single signature record
- **`createDocumentSignatures`**: Batch create multiple signatures
- **`getDocumentSignatures`**: Get all signatures for a document
- **`getSignatureByToken`**: Find signature by verification token
- **`getSignatureById`**: Find signature by ID

### 5. PDF Signing Service ([pdf-signing.ts](f:/Monorepo/tepian-k3/packages/services/src/pdf/pdf-signing.ts))

Created comprehensive PDF manipulation service:

- **`generateQRCodeBuffer`**: Generate QR codes as PNG buffers
- **`embedQRCodesInPDF`**: Embed multiple QR codes into PDF using pdf-lib
- **`embedSingleQRCodeInPDF`**: Helper for single QR code
- **`convertClientCoordinatesToPDFPoints`**: Convert canvas coordinates to PDF points

### 6. API Router ([document.ts:315-444](f:/Monorepo/tepian-k3/packages/api/src/routers/document.ts#L315-L444))

Updated `signDocumentWithQRCodes` endpoint to:

1. Accept PDF file and QR code positions
2. Generate document signatures with JWT
3. Embed QR codes into PDF using pdf-lib
4. Upload signed PDF to storage
5. Create document record
6. **Store signature records in database** (NEW)
7. Return document and signature information

## API Usage

### Endpoint: `signDocumentWithQRCodes`

**Input:**
```typescript
{
  entityId: string (UUID v7),
  entityType: "order" | "testing" | "company" | "user",
  type: DocumentType,
  title: string,
  file: File (PDF),
  qrCodes: Array<{
    userId: string (UUID v7),
    userName: string,
    purpose: string,
    position: {
      x: number,
      y: number,
      width: number,
      height: number,
      page: number
    }
  }>
}
```

**Output:**
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
    // ... other document fields
  },
  signatures: Array<{
    id: string,
    userId: string,
    userName: string,
    purpose: string,
    verificationUrl: string,
    signatureOrder: number
  }>
}
```

## Workflow

### 1. Client Prepares Data

```typescript
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
```

### 2. Server Processing

```typescript
// 1. Generate document signatures with JWT
for (const qrCode of input.qrCodes) {
  const signature = createDocumentSignature(...)
  documentSignatures.push({...signature})
}

// 2. Embed QR codes into PDF
const signedPdfBuffer = embedQRCodesInPDF(originalBuffer, qrCodeData)

// 3. Upload signed PDF
const uploadedFile = storageService.upload(signedPdfBuffer, {...})

// 4. Create document record
const document = documentQueries.createDocument({...})

// 5. Store signatures in database
const signatureRecords = documentQueries.createDocumentSignatures([
  {
    documentId: document.id,
    signedByUserId: sig.userId,
    signerName: sig.userName,
    purpose: sig.purpose,
    signatureOrder: index + 1,
    qrCodePosition: sig.position,
    verificationToken: sig.verificationToken,
    verificationUrl: sig.verificationUrl,
    signatureData: sig.signatureData,
    fileHash: sig.fileHash,
  }
])
```

### 3. Verification Flow

When a QR code is scanned:

1. Extract verification token from URL
2. Call `getSignatureByToken(token)` to retrieve signature
3. Verify JWT signature data
4. Compare file hash if checking integrity
5. Record verification in `document_verifications` table

## Security Features

1. **JWT Signatures**: Each signature is cryptographically signed
2. **File Integrity**: SHA-256 hash stored for each signature
3. **Unique Tokens**: Each signature has a unique verification token
4. **Audit Trail**: Created/updated timestamps track signature history
5. **Soft Delete**: Signatures can be soft-deleted with `deleted_at`

## Database Queries

### Get All Signatures for a Document

```typescript
const signatures = await documentQueries.getDocumentSignatures(documentId);
```

Returns signatures with signer information ordered by signature order.

### Verify a Signature

```typescript
const signature = await documentQueries.getSignatureByToken(token);

if (signature) {
  // Verify JWT
  const result = await verifyDocumentSignature(signature.signatureData);

  // Check file integrity
  const isValid = await verifyFileIntegrity(currentFile, signature.fileHash);
}
```

## Migration

To apply the database changes:

```bash
npm run db:migrate
```

This will create the `document_signatures` table in your database.

## Next Steps

### Recommended Enhancements

1. **Signature Status**: Add status field (pending, signed, rejected, expired)
2. **Signature Workflow**: Implement sequential signing requirements
3. **Email Notifications**: Notify signers when document requires signature
4. **Signature Comments**: Allow signers to add comments
5. **Signature Revocation**: Implement signature revocation mechanism
6. **Signature Templates**: Define signature position templates for common documents
7. **Mobile Signing**: Optimize QR scanning and verification for mobile devices

### API Endpoints to Add

1. `getDocumentWithSignatures` - Retrieve document with all signature details
2. `verifySignatureByToken` - Public endpoint to verify signature
3. `requestSignature` - Notify users to sign a document
4. `withdrawSignature` - Allow signer to withdraw signature (if not finalized)
5. `getMyPendingSignatures` - List documents awaiting user's signature

## Testing

### Manual Testing Steps

1. Upload a PDF document
2. Add multiple QR codes at different positions
3. Call `signDocumentWithQRCodes` endpoint
4. Verify document record is created
5. Verify signature records are created
6. Download signed PDF and verify QR codes are embedded
7. Scan QR code and verify it links to verification URL
8. Query signatures using `getDocumentSignatures`

### Example Test Data

```typescript
const testData = {
  entityId: "01JQJR3X8K2HDYQ0MHW6N5ZP4Q",
  entityType: "order",
  type: "invoice",
  title: "Test Invoice with Signatures",
  file: pdfFile,
  qrCodes: [
    {
      userId: "01JQJR3X8K2HDYQ0MHW6N5ZP4A",
      userName: "John Doe",
      purpose: "Approved by Finance Manager",
      position: { x: 50, y: 50, width: 100, height: 100, page: 0 }
    },
    {
      userId: "01JQJR3X8K2HDYQ0MHW6N5ZP4B",
      userName: "Jane Smith",
      purpose: "Reviewed by CEO",
      position: { x: 400, y: 50, width: 100, height: 100, page: 0 }
    }
  ]
};
```

## Troubleshooting

### Common Issues

1. **QR codes not visible**: Check coordinate system (origin is top-left)
2. **Signature creation fails**: Verify user IDs exist in database
3. **Verification token collision**: Ensure crypto.randomBytes generates unique tokens
4. **PDF corruption**: Verify pdf-lib version compatibility
5. **File hash mismatch**: Ensure same buffer is used for signing and hashing

## References

- [PDF Signing Example](./pdf-signing-example.md)
- [Document Signing Service](f:/Monorepo/tepian-k3/packages/services/src/document-signing/index.ts)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
