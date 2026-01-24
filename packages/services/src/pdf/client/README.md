# Client-Side PDF Services

This directory contains browser-based PDF manipulation services for the Tepian K3 application.

## Overview

The client-side PDF services provide functionality to:
- Modify existing PDFs in the browser
- Add QR codes to PDFs with drag-and-drop positioning
- Generate QR codes with custom branding
- Extract, merge, and manipulate PDF pages
- Add text and images to PDFs

All operations run entirely in the browser using `pdf-lib`, with no server-side processing required.

## Services

### PDFModifierService

Main service for modifying PDF documents in the browser.

**Location**: `packages/services/src/pdf/client/pdf-modifier.ts`

#### Key Features

- Load PDFs from File, ArrayBuffer, or Uint8Array
- Add QR codes at specific positions
- Add text and images
- Extract and merge pages
- Export as Blob, base64, or download directly

#### Usage Examples

```typescript
import { PDFModifierService } from '@tepian-k3/services/pdf';

// Load PDF from file
const pdfDoc = await PDFModifierService.loadPDF(file);

// Add QR code
await PDFModifierService.addQRCodeToPDF(pdfDoc, qrCodeDataUrl, {
  x: 100,
  y: 100,
  width: 100,
  height: 100,
  page: 0,
});

// Save PDF
await PDFModifierService.savePDF(pdfDoc, 'modified.pdf');

// Or get as blob
const blob = await PDFModifierService.getPDFAsBlob(pdfDoc);
```

#### API Reference

##### `loadPDF(source: File | ArrayBuffer | Uint8Array): Promise<PDFDocument>`

Load a PDF document from various sources.

**Parameters:**
- `source` - PDF file or binary data

**Returns:** Promise resolving to PDFDocument instance

**Example:**
```typescript
const pdfDoc = await PDFModifierService.loadPDF(file);
```

##### `addQRCodeToPDF(pdfDoc: PDFDocument, qrCodeDataUrl: string, position: QRCodePosition): Promise<PDFDocument>`

Add a QR code to a PDF at a specific position.

**Parameters:**
- `pdfDoc` - PDF document instance
- `qrCodeDataUrl` - QR code as data URL (PNG or JPEG)
- `position` - QR code position and size

**Position Interface:**
```typescript
interface QRCodePosition {
  x: number;        // X coordinate (from left)
  y: number;        // Y coordinate (from top in UI coordinates)
  width: number;    // QR code width
  height: number;   // QR code height
  page: number;     // Page index (0-based)
}
```

**Example:**
```typescript
await PDFModifierService.addQRCodeToPDF(pdfDoc, qrCodeDataUrl, {
  x: 450,
  y: 700,
  width: 80,
  height: 80,
  page: 0,
});
```

##### `addTextToPDF(pdfDoc: PDFDocument, text: string, x: number, y: number, pageIndex: number, options?: TextOptions): Promise<PDFDocument>`

Add text to a PDF.

**Parameters:**
- `pdfDoc` - PDF document instance
- `text` - Text content
- `x` - X coordinate
- `y` - Y coordinate
- `pageIndex` - Page index (0-based)
- `options` - Optional text styling

**Options:**
```typescript
{
  size?: number;                              // Font size (default: 12)
  color?: { r: number; g: number; b: number }; // RGB color (0-1 range)
  rotation?: number;                          // Rotation in degrees
}
```

**Example:**
```typescript
await PDFModifierService.addTextToPDF(
  pdfDoc,
  'Verified Document',
  100,
  50,
  0,
  {
    size: 16,
    color: { r: 0, g: 0.5, b: 0 },
  }
);
```

##### `addImageToPDF(pdfDoc: PDFDocument, imageDataUrl: string, x: number, y: number, width: number, height: number, pageIndex: number): Promise<PDFDocument>`

Add an image to a PDF.

**Example:**
```typescript
await PDFModifierService.addImageToPDF(
  pdfDoc,
  logoDataUrl,
  50,
  50,
  100,
  50,
  0
);
```

##### `modifyPDF(source: File | ArrayBuffer | Uint8Array, options: PDFModificationOptions): Promise<PDFDocument>`

Perform multiple modifications in one call.

**Options Interface:**
```typescript
interface PDFModificationOptions {
  qrCode?: {
    dataUrl: string;
    position: QRCodePosition;
  };
  text?: Array<{
    content: string;
    x: number;
    y: number;
    size?: number;
    color?: { r: number; g: number; b: number };
    page: number;
  }>;
  images?: Array<{
    dataUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  }>;
}
```

**Example:**
```typescript
const pdfDoc = await PDFModifierService.modifyPDF(file, {
  qrCode: {
    dataUrl: qrCodeDataUrl,
    position: { x: 450, y: 700, width: 80, height: 80, page: 0 },
  },
  text: [
    { content: 'Verified', x: 100, y: 50, size: 14, page: 0 },
  ],
});
```

##### `savePDF(pdfDoc: PDFDocument, filename: string): Promise<void>`

Save PDF and trigger browser download.

**Example:**
```typescript
await PDFModifierService.savePDF(pdfDoc, 'document-with-qrcode.pdf');
```

##### `getPDFAsBlob(pdfDoc: PDFDocument): Promise<Blob>`

Get PDF as Blob for upload or other processing.

**Example:**
```typescript
const blob = await PDFModifierService.getPDFAsBlob(pdfDoc);
const formData = new FormData();
formData.append('file', blob, 'modified.pdf');
// Upload to server
```

##### `getPDFAsBase64(pdfDoc: PDFDocument): Promise<string>`

Get PDF as base64 data URL.

**Example:**
```typescript
const base64 = await PDFModifierService.getPDFAsBase64(pdfDoc);
// Use in iframe or img tag
```

##### `getPageCount(pdfDoc: PDFDocument): number`

Get total number of pages.

##### `getPageDimensions(pdfDoc: PDFDocument, pageIndex: number): { width: number; height: number }`

Get page dimensions in points.

##### `extractPages(source: File | ArrayBuffer | Uint8Array, pageIndices: number[]): Promise<PDFDocument>`

Extract specific pages into a new PDF.

**Example:**
```typescript
// Extract pages 1, 2, and 5
const newPdf = await PDFModifierService.extractPages(file, [0, 1, 4]);
```

##### `mergePDFs(sources: Array<File | ArrayBuffer | Uint8Array>): Promise<PDFDocument>`

Merge multiple PDFs into one.

**Example:**
```typescript
const mergedPdf = await PDFModifierService.mergePDFs([file1, file2, file3]);
```

---

### QRCodeGeneratorService

Service for generating QR codes in the browser.

**Location**: `packages/services/src/pdf/client/qrcode-generator.ts`

#### Key Features

- Generate QR codes as data URLs or canvas elements
- Support for error correction levels
- Custom colors and dimensions
- Branded QR codes with logos
- Batch generation
- Text length validation

#### Usage Examples

```typescript
import { QRCodeGeneratorService } from '@tepian-k3/services/pdf';

// Generate simple QR code
const dataUrl = await QRCodeGeneratorService.generateDataURL('https://example.com');

// Generate with options
const dataUrl = await QRCodeGeneratorService.generateDataURL('https://example.com', {
  errorCorrectionLevel: 'H',
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
});

// Generate verification QR code
const { qrCodeDataURL, verificationURL } =
  await QRCodeGeneratorService.generateVerificationQRCode(token, baseUrl);

// Generate branded QR code with logo
const brandedQR = await QRCodeGeneratorService.generateBrandedQRCode('https://example.com', {
  logo: logoDataUrl,
  logoSize: 20, // 20% of QR code size
});
```

#### API Reference

##### `generateDataURL(text: string, options?: QRCodeOptions): Promise<string>`

Generate QR code as PNG data URL.

**Options:**
```typescript
interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Default: 'H'
  width?: number;                                // Default: 200
  margin?: number;                               // Default: 1
  color?: {
    dark?: string;                               // Default: '#000000'
    light?: string;                              // Default: '#FFFFFF'
  };
}
```

**Error Correction Levels:**
- `L` - Low (7% correction)
- `M` - Medium (15% correction)
- `Q` - Quartile (25% correction)
- `H` - High (30% correction)

**Example:**
```typescript
const qrCode = await QRCodeGeneratorService.generateDataURL(
  'https://verify.example.com/abc123',
  {
    errorCorrectionLevel: 'H',
    width: 200,
    margin: 1,
  }
);
```

##### `generateCanvas(text: string, options?: QRCodeOptions): Promise<HTMLCanvasElement>`

Generate QR code as canvas element for further manipulation.

**Example:**
```typescript
const canvas = await QRCodeGeneratorService.generateCanvas('https://example.com');
document.body.appendChild(canvas);
```

##### `generateVerificationQRCode(verificationToken: string, baseUrl?: string): Promise<{ qrCodeDataURL: string; verificationURL: string }>`

Generate QR code for document verification.

**Example:**
```typescript
const { qrCodeDataURL, verificationURL } =
  await QRCodeGeneratorService.generateVerificationQRCode(
    'abc123token',
    'https://verify.example.com'
  );

// Use the QR code
console.log('QR Code:', qrCodeDataURL);
console.log('Verification URL:', verificationURL);
```

##### `generateBrandedQRCode(text: string, options?: QRCodeOptions & { logo?: string; logoSize?: number }): Promise<string>`

Generate QR code with centered logo.

**Options:**
- All standard QRCodeOptions
- `logo` - Logo image as data URL
- `logoSize` - Logo size as percentage (0-100, default: 20)

**Example:**
```typescript
const brandedQR = await QRCodeGeneratorService.generateBrandedQRCode(
  'https://example.com',
  {
    logo: logoDataUrl,
    logoSize: 25,
    width: 300,
    errorCorrectionLevel: 'H', // High EC needed for logo overlay
  }
);
```

##### `validateTextLength(text: string, errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'): { isValid: boolean; maxLength: number; currentLength: number }`

Validate if text fits in QR code.

**Example:**
```typescript
const validation = QRCodeGeneratorService.validateTextLength(longUrl, 'H');
if (!validation.isValid) {
  console.error(`Text too long: ${validation.currentLength}/${validation.maxLength}`);
}
```

##### `generateBatch(items: Array<{ text: string; options?: QRCodeOptions }>): Promise<Array<{ text: string; dataURL: string }>>`

Generate multiple QR codes at once.

**Example:**
```typescript
const qrCodes = await QRCodeGeneratorService.generateBatch([
  { text: 'https://example.com/1' },
  { text: 'https://example.com/2', options: { width: 300 } },
  { text: 'https://example.com/3' },
]);
```

##### `downloadQRCode(text: string, filename: string, options?: QRCodeOptions): Promise<void>`

Generate and download QR code as PNG file.

**Example:**
```typescript
await QRCodeGeneratorService.downloadQRCode(
  'https://example.com',
  'verification-qrcode.png',
  { width: 400 }
);
```

---

## Complete Examples

### Example 1: Add QR Code to Existing PDF

```typescript
import { PDFModifierService, QRCodeGeneratorService } from '@tepian-k3/services/pdf';

async function addQRCodeToDocument(pdfFile: File, verificationUrl: string) {
  // 1. Generate QR code
  const qrCodeDataUrl = await QRCodeGeneratorService.generateDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    width: 200,
  });

  // 2. Load PDF
  const pdfDoc = await PDFModifierService.loadPDF(pdfFile);

  // 3. Add QR code to bottom-right corner of first page
  const dimensions = PDFModifierService.getPageDimensions(pdfDoc, 0);
  await PDFModifierService.addQRCodeToPDF(pdfDoc, qrCodeDataUrl, {
    x: dimensions.width - 110,
    y: dimensions.height - 110,
    width: 100,
    height: 100,
    page: 0,
  });

  // 4. Save modified PDF
  await PDFModifierService.savePDF(pdfDoc, 'document-with-qrcode.pdf');
}
```

### Example 2: Bulk Add QR Codes to Multiple PDFs

```typescript
import { PDFModifierService, QRCodeGeneratorService } from '@tepian-k3/services/pdf';

async function addQRCodesToMultiplePDFs(
  files: File[],
  verificationTokens: string[]
) {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const token = verificationTokens[i];

    // Generate QR code for this document
    const { qrCodeDataURL, verificationURL } =
      await QRCodeGeneratorService.generateVerificationQRCode(token);

    // Modify PDF
    const pdfDoc = await PDFModifierService.modifyPDF(file, {
      qrCode: {
        dataUrl: qrCodeDataURL,
        position: { x: 450, y: 700, width: 80, height: 80, page: 0 },
      },
      text: [
        {
          content: `Verification: ${verificationURL}`,
          x: 50,
          y: 780,
          size: 8,
          page: 0,
        },
      ],
    });

    // Get as blob
    const blob = await PDFModifierService.getPDFAsBlob(pdfDoc);

    results.push({
      filename: file.name,
      blob,
      verificationURL,
    });
  }

  return results;
}
```

### Example 3: Create Branded QR Code with Logo

```typescript
import { QRCodeGeneratorService } from '@tepian-k3/services/pdf';

async function createBrandedQRCode(url: string, logoFile: File) {
  // Convert logo to data URL
  const logoDataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(logoFile);
  });

  // Generate branded QR code
  const brandedQR = await QRCodeGeneratorService.generateBrandedQRCode(url, {
    logo: logoDataUrl,
    logoSize: 20,
    width: 400,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#1e40af', // Blue QR code
      light: '#ffffff',
    },
  });

  return brandedQR;
}
```

### Example 4: Extract and Merge PDF Pages

```typescript
import { PDFModifierService } from '@tepian-k3/services/pdf';

async function extractAndMergePages(
  sourceFile: File,
  pageRanges: number[][]
) {
  const extractedPDFs = await Promise.all(
    pageRanges.map(range =>
      PDFModifierService.extractPages(sourceFile, range)
    )
  );

  // Convert PDFDocuments to bytes for merging
  const pdfBytes = await Promise.all(
    extractedPDFs.map(doc => doc.save())
  );

  // Merge all extracted pages
  const mergedPDF = await PDFModifierService.mergePDFs(pdfBytes);

  return mergedPDF;
}

// Usage
const result = await extractAndMergePages(file, [
  [0, 1, 2],    // Pages 1-3
  [5, 6],       // Pages 6-7
  [10, 11, 12], // Pages 11-13
]);
```

### Example 5: Upload Modified PDF to Server

```typescript
import { PDFModifierService } from '@tepian-k3/services/pdf';

async function modifyAndUploadPDF(
  file: File,
  qrCodeDataUrl: string,
  uploadUrl: string
) {
  // Modify PDF
  const pdfDoc = await PDFModifierService.modifyPDF(file, {
    qrCode: {
      dataUrl: qrCodeDataUrl,
      position: { x: 450, y: 700, width: 80, height: 80, page: 0 },
    },
  });

  // Get as blob
  const blob = await PDFModifierService.getPDFAsBlob(pdfDoc);

  // Upload to server
  const formData = new FormData();
  formData.append('file', blob, 'modified-document.pdf');
  formData.append('documentId', 'abc123');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}
```

---

## React Component Integration

### Example: PDF QR Code Editor Component

The package includes a complete React component for drag-and-drop PDF editing:

**Location**: `apps/web/src/components/pdf/pdf-qrcode-editor.tsx`

**Features:**
- Drag-and-drop PDF upload
- QR code generation
- Visual QR code positioning
- Multi-page support
- Zoom controls
- Real-time preview

**Usage:**
```typescript
import { PDFQRCodeEditor } from '~/components/pdf/pdf-qrcode-editor';

function MyPage() {
  return (
    <PDFQRCodeEditor
      defaultQRText="https://verify.example.com/abc123"
      defaultFilename="verified-document.pdf"
      onSave={(blob, filename) => {
        // Upload to server or trigger download
        console.log('Saved:', filename);
      }}
      onCancel={() => {
        // Handle cancel
      }}
    />
  );
}
```

### Example: Inline PDF Editor

```typescript
import { useState } from 'react';
import { PDFModifierService, QRCodeGeneratorService } from '@tepian-k3/services/pdf';

export function InlinePDFEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [qrText, setQrText] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!file || !qrText) return;

    setProcessing(true);
    try {
      // Generate QR code
      const qrCode = await QRCodeGeneratorService.generateDataURL(qrText);

      // Modify PDF
      const pdfDoc = await PDFModifierService.modifyPDF(file, {
        qrCode: {
          dataUrl: qrCode,
          position: { x: 450, y: 700, width: 80, height: 80, page: 0 },
        },
      });

      // Download
      await PDFModifierService.savePDF(pdfDoc, 'modified.pdf');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <input
        type="text"
        value={qrText}
        onChange={(e) => setQrText(e.target.value)}
        placeholder="Enter QR code text"
      />
      <button onClick={handleProcess} disabled={processing}>
        {processing ? 'Processing...' : 'Add QR Code'}
      </button>
    </div>
  );
}
```

---

## TanStack Router Integration

A complete PDF editor route is available:

**Location**: `apps/web/src/routes/(core)/pdf-editor.tsx`

**Access**: Navigate to `/pdf-editor` in the application

**Features:**
- Full-screen PDF editor
- Drag-and-drop interface
- QR code generation and positioning
- Multi-page support
- Save and download functionality

---

## Error Handling

All services throw descriptive errors. Always wrap calls in try-catch:

```typescript
try {
  const pdfDoc = await PDFModifierService.loadPDF(file);
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to load PDF:', error.message);
    // Show user-friendly error
    alert('Unable to load PDF file. Please ensure it is a valid PDF.');
  }
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to load PDF" | Invalid or corrupted PDF | Verify file is valid PDF |
| "QR code must be PNG or JPEG format" | Invalid image format | Use PNG or JPEG data URL |
| "Page X not found" | Invalid page index | Check page count first |
| "Failed to generate QR code" | Invalid text or options | Validate input text |

---

## Performance Considerations

### PDF Loading
- Large PDFs (>10MB) may take several seconds to load
- Consider showing loading indicator

### QR Code Generation
- Very fast (<100ms for most cases)
- Branded QR codes with logos may take longer

### PDF Modification
- Adding elements is fast
- Multiple operations can be chained
- Save operation may take 1-2 seconds for large PDFs

### Best Practices

1. **Batch Operations**: Use `modifyPDF()` for multiple operations instead of individual calls
2. **Memory Management**: Clean up blob URLs with `URL.revokeObjectURL()`
3. **Large Files**: Show progress indicators for files >5MB
4. **Validation**: Validate file type before processing

```typescript
// Good: Batch operations
const pdfDoc = await PDFModifierService.modifyPDF(file, {
  qrCode: { /* ... */ },
  text: [ /* ... */ ],
  images: [ /* ... */ ],
});

// Less efficient: Individual operations
let pdfDoc = await PDFModifierService.loadPDF(file);
pdfDoc = await PDFModifierService.addQRCodeToPDF(pdfDoc, ...);
pdfDoc = await PDFModifierService.addTextToPDF(pdfDoc, ...);
pdfDoc = await PDFModifierService.addImageToPDF(pdfDoc, ...);
```

---

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 13+)
- **Mobile browsers**: Supported but may be slow for large files

---

## TypeScript Support

All services are fully typed with TypeScript:

```typescript
import type {
  QRCodePosition,
  PDFModificationOptions,
  QRCodeOptions,
} from '@tepian-k3/services/pdf';

const position: QRCodePosition = {
  x: 100,
  y: 100,
  width: 80,
  height: 80,
  page: 0,
};
```

---

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { QRCodeGeneratorService } from '@tepian-k3/services/pdf';

describe('QRCodeGeneratorService', () => {
  it('should generate QR code data URL', async () => {
    const dataUrl = await QRCodeGeneratorService.generateDataURL('test');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should validate text length', () => {
    const result = QRCodeGeneratorService.validateTextLength('short', 'H');
    expect(result.isValid).toBe(true);
  });
});
```

---

## Migration from Server-Side

If you were using server-side PDF generation, you can migrate to client-side:

**Before (Server-side):**
```typescript
// POST to server
const response = await fetch('/api/pdf/add-qrcode', {
  method: 'POST',
  body: formData,
});
```

**After (Client-side):**
```typescript
// Process in browser
const pdfDoc = await PDFModifierService.modifyPDF(file, options);
const blob = await PDFModifierService.getPDFAsBlob(pdfDoc);
// Optionally upload result
```

**Benefits:**
- ✅ Faster (no upload/download)
- ✅ More secure (file never leaves browser)
- ✅ Better UX (instant preview)
- ✅ Reduced server load

---

## Support and Troubleshooting

### Common Issues

**Issue**: QR code appears blurry
**Solution**: Increase QR code width in options (min 200px recommended)

**Issue**: PDF appears corrupted after modification
**Solution**: Ensure source PDF is valid before modification

**Issue**: Large PDFs cause browser to freeze
**Solution**: Show loading indicator and consider breaking into smaller operations

### Getting Help

Check the example code in this documentation or the component source code at:
- `packages/services/src/pdf/client/pdf-modifier.ts`
- `packages/services/src/pdf/client/qrcode-generator.ts`
- `apps/web/src/components/pdf/pdf-qrcode-editor.tsx`

---

**Last Updated**: January 11, 2026
**Package Version**: @tepian-k3/services v1.0.0
