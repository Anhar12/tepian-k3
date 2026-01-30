# PDF Generation Service with QR Code Support

This package provides PDF generation capabilities with integrated QR code support for document verification.

## Features

- **Invoice Generation**: Create professional invoices with itemized billing
- **Offering Letter Generation**: Generate formal offering letters
- **QR Code Integration**: Embed verification QR codes in documents
- **Document Signing**: Integration with JWT-based document signing
- **Flexible Templates**: Built with @react-pdf/renderer for easy customization

## Structure

```
pdf/
├── components/
│   ├── letterhead.tsx       # Reusable letterhead component
│   └── qrcode.tsx           # QR code image component
├── generator/
│   ├── invoice.tsx          # Invoice PDF generator
│   └── offering-letter.tsx  # Offering letter PDF generator
├── templates/
│   ├── invoice.tsx          # Invoice template
│   └── offering-letter.tsx  # Offering letter template
├── utils/
│   └── qrcode.ts           # QR code generation utilities
├── index.ts                # Package exports
├── INTEGRATION_EXAMPLE.md  # Integration guide
└── README.md               # This file
```

## Installation

The required dependencies are already installed:

- `@react-pdf/renderer` - PDF generation
- `qrcode` - QR code generation
- `@types/qrcode` - TypeScript types

## Usage

### Basic Invoice Generation

```typescript
import { generateInvoicePdf } from "@tepian-k3/services/pdf";

const pdfBuffer = await generateInvoicePdf({
  order,
  invoiceNumber: "INV-001",
  dueDate: "2024-01-31",
  logoUrl: "https://example.com/logo.png",
});
```

### Invoice with QR Code

```typescript
import {
  generateInvoicePdf,
  generateDocumentVerificationQRCode,
} from "@tepian-k3/services/pdf";

// Generate QR code
const { qrCodeDataURL, verificationURL } = await runEffect(
  generateDocumentVerificationQRCode(
    verificationToken,
    "https://yourdomain.com",
  ),
);

// Generate PDF with QR code
const pdfBuffer = await generateInvoicePdf({
  order,
  invoiceNumber: "INV-001",
  dueDate: "2024-01-31",
  logoUrl: "https://example.com/logo.png",
  qrCodeDataURL,
  verificationURL,
});
```

### Offering Letter Generation

```typescript
import { generateOfferingLetterPdf } from "@tepian-k3/services/pdf";

const pdfBuffer = await generateOfferingLetterPdf({
  order,
  letterNumber: "001/OFFER/2024",
  referenceNumber: "123/REF/2024",
  referenceDate: "2024-01-15",
  adminEmail: "admin@example.com",
  adminContact: "+62 812-3456-7890",
  logoUrl: "https://example.com/logo.png",
  qrCodeDataURL,
  verificationURL,
});
```

## QR Code Utilities

### Generate QR Code Data URL

For embedding in PDFs:

```typescript
import { generateQRCodeDataURL } from "@tepian-k3/services/pdf";
import { runEffect } from "@tepian-k3/api/utils/run-effect";

const dataURL = await runEffect(
  generateQRCodeDataURL("https://example.com/verify/token123"),
);
```

### Generate QR Code Buffer

For saving to file:

```typescript
import { generateQRCodeBuffer } from "@tepian-k3/services/pdf";

const buffer = await runEffect(
  generateQRCodeBuffer("https://example.com/verify/token123"),
);
```

### Generate Verification URL

```typescript
import { generateVerificationURL } from "@tepian-k3/services/pdf";

const url = generateVerificationURL(
  "verification-token-here",
  "https://yourdomain.com",
);
// Returns: "https://yourdomain.com/verify/verification-token-here"
```

### All-in-One Helper

```typescript
import { generateDocumentVerificationQRCode } from "@tepian-k3/services/pdf";

const { qrCodeDataURL, verificationURL } = await runEffect(
  generateDocumentVerificationQRCode(
    "verification-token",
    "https://yourdomain.com",
    {
      width: 150,
      margin: 2,
      errorCorrectionLevel: "H",
    },
  ),
);
```

## Components

### QRCodeImage Component

A reusable component for displaying QR codes in PDF templates:

```typescript
import { QRCodeImage } from "../components/qrcode";

<QRCodeImage
  qrCodeDataURL={qrCodeDataURL}
  label="Scan untuk verifikasi dokumen"
  verificationText={verificationURL}
  width={120}
  height={120}
/>
```

### Letterhead Component

```typescript
import { Letterhead } from "../components/letterhead";

<Letterhead logoUrl="https://example.com/logo.png" />
```

## Customization

### Custom QR Code Options

```typescript
const { qrCodeDataURL } = await runEffect(
  generateQRCodeDataURL("data", {
    width: 200, // Size in pixels
    margin: 1, // Margin in modules
    errorCorrectionLevel: "H", // L, M, Q, or H
    color: {
      dark: "#000000", // QR code color
      light: "#FFFFFF", // Background color
    },
  }),
);
```

### Custom PDF Styles

Templates use StyleSheet from `@react-pdf/renderer`. Modify the styles in the template files to customize appearance.

## Integration with Document Signing

See [INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md) for complete examples of integrating QR codes with the document signing service.

## Environment Variables

```env
# Base URL for verification pages
DOCUMENT_VERIFICATION_BASE_URL=https://yourdomain.com/verify
```

## TypeScript Types

All functions are fully typed. Import types from the package:

```typescript
import type { OrderWithCompanyAndItems } from "@tepian-k3/types/order.types";
```

## Error Handling

All async operations use Effect for error handling:

```typescript
import { runEffect } from "@tepian-k3/api/utils/run-effect";

try {
  const result = await runEffect(generateQRCodeDataURL("data"));
} catch (error) {
  // Handle error
}
```

## Performance Notes

- QR codes are generated on-demand
- PDFs are rendered to streams for memory efficiency
- Use caching for frequently accessed documents
- Consider generating QR codes once and reusing the data URL

## Examples

For complete integration examples, see:

- [INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md) - Full integration guide
- `packages/api/src/routers/order.ts` - Real-world usage in API

## Troubleshooting

### QR Code Not Appearing

1. Ensure `qrCodeDataURL` is passed to the template
2. Check that the QR code is generated before PDF rendering
3. Verify the data URL format (should start with `data:image/png;base64,`)

### PDF Generation Fails

1. Check all required props are provided
2. Verify order data has all necessary relations loaded
3. Check logo URL is accessible

### Verification Token Issues

1. Ensure verification token is stored in database
2. Check that `DOCUMENT_VERIFICATION_BASE_URL` is set
3. Verify token length (should be 64 characters)

## License

MIT
