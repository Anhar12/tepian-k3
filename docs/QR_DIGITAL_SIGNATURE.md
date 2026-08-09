# Panduan Implementasi Tanda Tangan Digital (QR Code Signature)

## 📌 Gambaran Umum

Fitur Tanda Tangan Digital (TTE) berbasis QR Code memungkinkan pengguna memasukkan stempel QR Code secara visual dan fleksibel (posisi draggable & ukuran resizable) ke dalam dokumen PDF resmi seperti:

- **Surat Penawaran** (Offering Letter)
- **SPK** (Surat Perintah Kerja)
- **SPT** (Surat Perintah Tugas)
- **Invoice / Tagihan**

---

## 🏗️ Arsitektur & Alur Data

# Panduan Implementasi Tanda Tangan Digital (QR Code Signature)

## 📌 Gambaran Umum

Fitur Tanda Tangan Digital (TTE) berbasis QR Code memungkinkan pengguna memasukkan stempel QR Code secara visual dan fleksibel (posisi draggable, resizable, dan multi-page vertical scroll) ke dalam dokumen PDF resmi seperti:

- **Surat Penawaran** (Offering Letter)
- **SPK** (Surat Perintah Kerja)
- **SPT** (Surat Perintah Tugas)
- **Invoice / Tagihan**

---

## 🏗️ Arsitektur & Alur Data

Proses penandatanganan dilakukan pada **Halaman Terpisah** (`/(core)/document-signing/`) untuk memberikan tampilan pratinjau penuh (_full preview_) serta kemudahan navigasi antar halaman dokumen:

```text
[Dialog Dokumen / Action Menu]
    │  (Form input data dokumen standar)
    │  1. Klik "Atur Tanda Tangan Digital" -> Simpan data & PDF base64 ke sessionStorage
    │  2. Redirect ke route `/(core)/document-signing?sessionKey=...`
    ▼
[Document Signing Route (`/document-signing`)]
    │  1. Mengambil data payload dari sessionStorage
    │  2. Deteksi otomatis total halaman PDF via `pdf-lib`
    │  3. Menampilkan QRSignaturePlacer dalam 2-kolom layout (Kontrol & Preview Vertikal)
    ▼
[QRSignaturePlacer Component]
    │  (Mengatur posisi { x, y, width, height, page, userId, purpose })
    ▼
[tRPC Router Mutation] (`generateOfferingLetter`, `generateSpkDocument`, dll)
    │  1. Backend menerima array `signatures`
    │  2. panggil `pdfSigningService.embedQRCodesInPDF()`
    │  3. Simpan PDF ber-QR ke S3 / Local Storage via `storageService`
    │  4. Simpan log tanda tangan ke tabel DB `document_signatures`
    ▼
[Output PDF File] (Pratinjau otomatis dibuka di Tab Baru tanpa hambatan login)
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
- **Multi-Page Vertical Layout**: Menampilkan seluruh halaman PDF secara kontinu dengan scroll vertikal.
- **Multi-Signer Support**: Menambah penandatangan tambahan jika diperlukan tanpa batas rekomendasi kaku.

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

1. Simpan payload form dan PDF mentah ke `sessionStorage` dengan key acak (misal `doc_signing_<timestamp>`).
2. Navigasikan user ke route signing:
   ```typescript
   sessionStorage.setItem(
     sessionKey,
     JSON.stringify({ type: "SPK", payload, pdfBase64 }),
   );
   navigate({ to: "/document-signing", search: { sessionKey } });
   ```
3. Halaman `/document-signing` akan membaca data tersebut, mendeteksi halaman otomatis, dan menampilkan `QRSignaturePlacer`.
4. Saat tombol **Selesaikan & Cetak Dokumen** diklik, halaman signing memanggil tRPC mutation backend dengan menyertakan `signatures: [...]`.
5. Hasil PDF bertanda tangan direspons sebagai base64 dan langsung dibuka di **Tab Baru** (`openBase64InNewTab`).
