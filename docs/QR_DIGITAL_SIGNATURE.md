# Panduan Implementasi Tanda Tangan Digital (QR Code Signature)

## 📌 Gambaran Umum

Fitur Tanda Tangan Digital (TTE) berbasis QR Code memungkinkan pengguna memasukkan stempel QR Code secara visual dan fleksibel (posisi draggable & ukuran resizable) ke dalam dokumen PDF resmi seperti:

- **Surat Penawaran** (Offering Letter)
- **SPK** (Surat Perintah Kerja)
- **SPT** (Surat Perintah Tugas)
- **Invoice / Tagihan**

---

## 🏗️ Arsitektur & Alur Data

```text
[Frontend Wizard UI Step 2]
    │  (Pengguna menggeser & meresize stempel QR di atas preview PDF)
    ▼
[QRSignaturePlacer Component]
    │  (Mengirimkan koordinat { x, y, width, height, page, userId, purpose })
    ▼
[Zod Schema Validation] (`generateDocumentSchema`)
    │  (Validasi array signatures & atribut opsional)
    ▼
[tRPC Router] (`generateOfferingLetter`, `generateSpkDocument`, dll)
    │  1. Generate file PDF mentah
    │  2. panggil `pdfSigningService.embedQRCodesInPDF()`
    │  3. Simpan PDF ber-QR ke S3 / Local Storage via `storageService`
    │  4. Simpan log tanda tangan ke tabel DB `document_signatures`
    ▼
[Output PDF File] (Siap diunduh / dicetak oleh pengguna)
```

---

## ⚙️ Komponen Utama

### 1. Schema Validation (`packages/schema/src/pengujian/generate-document.schema.ts`)

```typescript
export const qrSignaturePositionSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string().min(1),
  purpose: z.string().min(1),
  page: z.number().int().min(0).default(0),
  x: z.number().min(0).default(450),
  y: z.number().min(0).default(700),
  width: z.number().min(60).max(200).default(100),
  height: z.number().min(60).max(200).default(100),
});
```

### 2. Komponen Frontend (`apps/web/src/components/document-signing/qr-signature-placer.tsx`)

Komponen visual untuk mengatur letak dan ukuran stempel QR:

- **Drag & Drop**: Menggeser stempel QR di seluruh permukaan halaman preview PDF.
- **Resize Handle**: Mengubah ukuran stempel QR secara dinamis.
- **Multi-Signer Support**: Menambah penandatangan tambahan jika diperlukan.

### 3. Backend Service (`packages/services/src/pdf/pdf-signing.ts`)

Mengonversi koordinat layar browser (rasio 800x1100) ke poin PDF standar (72 DPI):

```typescript
export function convertClientCoordinatesToPDFPoints(
  clientCoords: QRSignaturePosition,
  pdfPageWidthPoints: number,
  pdfPageHeightPoints: number,
): QRSignaturePositionInPoints {
  const scaleX = pdfPageWidthPoints / 800;
  const scaleY = pdfPageHeightPoints / 1100;

  return {
    pageIndex: clientCoords.page,
    x: clientCoords.x * scaleX,
    // PDF Y-axis dimulai dari bawah ke atas
    y: pdfPageHeightPoints - (clientCoords.y + clientCoords.height) * scaleY,
    width: clientCoords.width * scaleX,
    height: clientCoords.height * scaleY,
  };
}
```

---

## 🛠️ Cara Mengintegrasikan ke Dialog Dokumen Baru

Jika ingin menambahkan fitur QR signature ke dialog dokumen baru:

1. Tambahkan `signatures: z.array(qrSignaturePositionSchema).optional().default([])` pada schema Zod dokumen.
2. Impor `QRSignaturePlacer` dan buat flow **2-Step Wizard** di dialog frontend:
   - **Step 1**: Form isian data standar + tombol _"Cetak Tanpa QR"_ (memanggil `form.handleSubmit` dengan `signatures: []`).
   - **Step 2**: Komponen `QRSignaturePlacer` untuk mengatur posisi stempel QR + tombol _"Cetak Dokumen Bertanda Tangan"_.
3. Di router tRPC backend, cek jika `signatures.length > 0`:
   - Panggil `pdfSigningService.embedQRCodesInPDF(pdfBuffer, signatures)`.
   - Simpan PDF hasil tanda tangan ke `storageService` dan simpan log ke `documentSignatures`.
