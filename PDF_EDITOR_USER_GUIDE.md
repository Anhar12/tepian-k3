# PDF QR Code Editor - User Guide

## Overview

The PDF QR Code Editor is a browser-based tool for adding QR codes to PDF documents with drag-and-drop positioning. It uses `@hello-pangea/dnd` for list management and native mouse events for canvas positioning.

## Features

### ✨ Key Features

- **📄 PDF Upload**: Drag-and-drop or click to upload PDF files
- **🔲 QR Code Generation**: Generate QR codes from any text or URL
- **🎯 Drag-and-Drop Positioning**: Directly drag QR codes on the PDF preview
- **📐 Resize Controls**: Adjust QR code size with buttons or keyboard
- **⌨️ Keyboard Shortcuts**: Power user features for precise control
- **🔄 Layer Management**: Reorder QR codes to control z-index
- **📑 Multi-Page Support**: Add QR codes to any page
- **🔍 Zoom Controls**: 50% to 200% zoom for precision
- **💾 Save & Export**: Download modified PDF or upload to server

## Getting Started

### 1. Access the Editor

Navigate to `/pdf-editor` in your application.

### 2. Upload a PDF

**Method 1: Drag and Drop**
- Drag a PDF file from your computer
- Drop it onto the upload area

**Method 2: Click to Select**
- Click the upload area
- Select a PDF file from the file picker

### 3. Generate a QR Code

1. Enter text or URL in the text area (e.g., verification URL)
2. Click "Generate QR Code"
3. Preview appears in the sidebar
4. Click "Add to PDF" to place it on the current page

### 4. Position the QR Code

**Method 1: Drag on PDF (Recommended)**
- Click and hold on the QR code on the PDF preview
- Drag it to the desired position
- Release to drop

**Method 2: Keyboard Control**
- Select a QR code by clicking on it
- Use arrow keys to move:
  - Arrow keys: Move 1 pixel
  - Shift + Arrow keys: Move 10 pixels

### 5. Adjust Size

**Method 1: Sidebar Buttons**
- Click `−` to make smaller (min: 50px)
- Click `+` to make larger (max: 300px)

**Method 2: Keyboard**
- Press `+` or `=` to increase size
- Press `-` or `_` to decrease size

### 6. Manage Layers

**Reorder QR Codes:**
- In the sidebar list, drag the `⋮⋮` handle
- Move up/down to change z-index (which QR appears on top)

### 7. Save the PDF

Click "Save PDF" button to download the modified document with all QR codes embedded.

## User Interface

```
┌─────────────────────────────────────────────────────────────┐
│  PDF QR Code Editor                    [Cancel] [Save PDF]  │
├────────────┬────────────────────────────────────────────────┤
│ SIDEBAR    │  CANVAS                                        │
│            │                                                 │
│ 1. Upload  │  ┌──────────────────────────────┐             │
│ [PDF Drop] │  │                              │             │
│            │  │  Page 1 of 3                 │             │
│ 2. QR Gen  │  │                              │             │
│ [Text...]  │  │  ┌─────┐                    │             │
│ [Generate] │  │  │ QR  │ ← Drag to position  │             │
│            │  │  └─────┘                    │             │
│ [Preview]  │  │                              │             │
│ [Add]      │  └──────────────────────────────┘             │
│            │                                                 │
│ 3. List    │  [−] 100% [+]                                  │
│ ⋮⋮ QR 1    │                                                 │
│    100×100 │                                                 │
│    [−+✕]   │                                                 │
│            │                                                 │
│ Shortcuts  │                                                 │
│ • Arrow    │                                                 │
│ • +/-      │                                                 │
│ • Delete   │                                                 │
└────────────┴────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

### Navigation & Selection
- **Click**: Select QR code
- **Tab**: Cycle through UI elements

### Positioning (when QR selected)
- **↑ ↓ ← →**: Move 1 pixel
- **Shift + ↑ ↓ ← →**: Move 10 pixels

### Sizing (when QR selected)
- **+ or =**: Increase size by 10px
- **- or _**: Decrease size by 10px

### Actions (when QR selected)
- **Delete or Backspace**: Remove QR code

### View Controls
- **Mouse wheel**: Scroll canvas
- Use zoom buttons for zoom control

## Workflow Examples

### Example 1: Adding Verification QR to Invoice

1. Upload `invoice-001.pdf`
2. Enter verification URL: `https://verify.example.com/doc/abc123`
3. Click "Generate QR Code"
4. Click "Add to PDF" (appears at top-left by default)
5. Drag QR code to bottom-right corner
6. Resize to 80×80px using `−` button
7. Click "Save PDF"
8. Result: `modified-document.pdf` with verification QR

### Example 2: Multiple QR Codes on Different Pages

1. Upload multi-page PDF
2. Navigate to page 1 with page controls
3. Generate and add QR code for page 1
4. Click "Next →" to go to page 2
5. Generate and add different QR code for page 2
6. Use sidebar list to see all QR codes
7. Drag list items to reorder layers if needed
8. Save PDF with all QR codes

### Example 3: Precise Positioning

1. Add QR code to PDF
2. Click on QR code to select it
3. Use arrow keys to position exactly:
   - Press ← 50 times (or Shift+← 5 times) to move left 50px
   - Press ↓ 20 times (or Shift+↓ 2 times) to move down 20px
4. Fine-tune with single pixel movements
5. Save when positioned perfectly

## Technical Details

### Implementation

**Drag-and-Drop Technology:**
- **Sidebar List**: `@hello-pangea/dnd` for smooth reordering
- **PDF Canvas**: Native mouse events for free-form positioning

**Why Hybrid Approach?**
- `@hello-pangea/dnd` excels at list reordering but isn't designed for 2D canvas positioning
- Native mouse events provide pixel-perfect control on the canvas
- Best of both worlds: professional list UX + precise positioning

### File Requirements

- **Format**: PDF files only
- **Size**: Recommended < 5MB (larger files work but may be slow)
- **Pages**: Supports multi-page PDFs

### QR Code Specifications

- **Format**: PNG with base64 encoding
- **Error Correction**: High (H level - 30% correction)
- **Size Range**: 50px to 300px
- **Default Size**: 100×100px
- **Text Capacity**:
  - Up to 1,273 characters with high error correction
  - Longer text needs lower error correction level

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Edge 90+ | ✅ Full | Recommended |
| Firefox 88+ | ✅ Full | Works well |
| Safari 14+ | ✅ Full | Works well |
| Mobile Chrome | ✅ Full | May be slower |
| Mobile Safari | ✅ Full | iOS 13+ required |

### Performance Tips

1. **Large PDFs**: Use zoom out for better overview
2. **Many QR Codes**: Use list to select instead of clicking
3. **Precise Work**: Use keyboard shortcuts for fine control
4. **Multiple Changes**: Make all changes before saving (only saves once)

## Troubleshooting

### PDF Won't Load

**Problem**: "Failed to load PDF" error

**Solutions:**
- Ensure file is a valid PDF (not corrupted)
- Check file size (< 20MB recommended)
- Try a different PDF file
- Check browser console for detailed error

### QR Code Blurry

**Problem**: QR code appears pixelated in final PDF

**Solutions:**
- Generate QR at larger size (200px or more)
- Ensure high error correction level is used
- Don't resize QR too large on PDF

### Drag Not Working

**Problem**: Can't drag QR code on PDF

**Solutions:**
- Click directly on the QR code image (not border)
- Ensure QR code is selected (blue ring visible)
- Try clicking and holding for 100ms before dragging
- Check browser console for errors

### Save Button Disabled

**Problem**: Can't click "Save PDF"

**Reasons:**
- No PDF uploaded
- No QR codes added
- Currently processing (wait for completion)

## API Integration

### Upload to Server After Saving

```typescript
<PDFQRCodeEditor
  onSave={async (blob, filename) => {
    // Upload to server
    const formData = new FormData();
    formData.append('file', blob, filename);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('Uploaded:', result.documentId);
  }}
/>
```

### Pre-populate QR Text

```typescript
<PDFQRCodeEditor
  defaultQRText="https://verify.example.com/doc/abc123"
  defaultFilename="verified-invoice.pdf"
/>
```

## Best Practices

### 1. QR Code Positioning

- **Bottom-right corner**: Traditional location for document verification
- **Top-right corner**: Alternative if bottom is crowded
- **Near signature**: Logical placement for signed documents
- **Avoid text overlap**: Ensure QR doesn't cover important content

### 2. QR Code Sizing

- **80×80px**: Good for verification codes on letters
- **100×100px**: Standard size, works for most cases
- **120×120px**: Better scanability for complex URLs
- **150×150px**: Use for primary document identifiers

### 3. Multi-Page Documents

- Add QR to **every page** for page-by-page verification
- Use **different QR codes** for different pages if needed
- Place QR codes **consistently** (same position on each page)

### 4. Workflow Efficiency

- Generate all QR codes **before** adding to PDF
- Use **keyboard shortcuts** for bulk positioning
- Test scan QR codes **before** final save
- Keep **backup** of original PDF

## Advanced Features

### Verification URL Format

Recommended format for verification QR codes:

```
https://verify.example.com/document/{token}
```

Where:
- Base URL: Your verification endpoint
- Token: Unique document identifier (secure random string)

Example:
```
https://verify.tepian-k3.com/document/a1b2c3d4e5f6g7h8
```

### Batch Processing

For processing multiple PDFs:

1. Open editor for first PDF
2. Add and position QR codes
3. Save PDF
4. Repeat for next PDF

*Note: Batch automation would require custom scripting with the PDF services API.*

### Custom Styling

QR codes are embedded as-is. For custom styling:

1. Generate branded QR code separately using `generateBrandedQRCode()`
2. Use that QR code data URL in the editor

## Security Considerations

### Client-Side Processing

- ✅ Files never leave user's browser (until user saves/uploads)
- ✅ No server-side PDF processing required
- ✅ Full user control over data
- ✅ Works offline after initial page load

### QR Code Content

- ⚠️ QR codes can contain any text/URL
- ⚠️ Validate URLs before generating
- ⚠️ Don't include sensitive data in QR text
- ✅ Use secure random tokens for verification

### Verification System

For document verification QR codes:

1. Generate secure random token server-side
2. Store token with document metadata
3. Use token in QR code URL
4. Verify token on server when scanned
5. Display document info if valid

## Support

### Getting Help

1. Check this user guide
2. Review [API documentation](packages/services/src/pdf/client/README.md)
3. Check browser console for errors
4. Review [implementation summary](CLIENT_SIDE_PDF_IMPLEMENTATION.md)

### Common Questions

**Q: Can I add multiple QR codes to one page?**
A: Yes! Add as many as needed and use layer ordering to manage overlaps.

**Q: Can I edit QR codes after adding them?**
A: You can reposition and resize, but to change the QR content, remove and add a new one.

**Q: Does this work offline?**
A: Yes, after initial page load, all processing happens in the browser.

**Q: What happens to the original PDF?**
A: It remains unchanged. A new PDF is created with QR codes added.

**Q: Can I undo changes?**
A: Currently no undo. Simply don't save and reload the PDF to start over.

---

**Version**: 1.0.0
**Last Updated**: January 11, 2026
**Library**: @hello-pangea/dnd v18.0.1, pdf-lib v1.17.1, qrcode v1.5.3
