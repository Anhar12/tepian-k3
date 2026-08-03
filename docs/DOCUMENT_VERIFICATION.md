# 📄 Sistem Verifikasi Dokumen - Tepian K3

## ✅ Apa yang Sudah Diimplementasikan

Sistem verifikasi dokumen yang mirip dengan **MagangHub Kemnaker** - memungkinkan siapa saja untuk memverifikasi keaslian dokumen melalui QR code tanpa perlu login.

### Fitur Utama

1. **Halaman Verifikasi Public** (`/verify/{token}`)
   - Dapat diakses tanpa login
   - Responsive design dengan gradient UI
   - Real-time verification dengan loading states
   - Error handling yang informatif

2. **QR Code Integration**
   - QR code embedded di PDF dokumen
   - Mengarah langsung ke halaman verifikasi
   - High error correction level untuk scan reliability

3. **Security Features**
   - JWT-based document signing (HMAC-SHA256)
   - SHA-256 file hash untuk integrity checking
   - Verification logging untuk audit trail
   - IP address dan user agent tracking

4. **User Experience**
   - Loading state dengan progress indicator
   - Success/Error state dengan visual feedback
   - Document information display yang lengkap
   - Disclaimer legal sesuai UU ITE

---

## 🎨 Standar Template PDF & Layout Dokumen

Seluruh template PDF yang dihasilkan oleh sistem (Surat Penawaran, SPK, SPT, Tagihan) dibangun menggunakan `@react-pdf/renderer` pada folder `@tepian-k3/services/src/pdf/templates`.

### 1. Kop Surat Resmi (`Letterhead`)

- **Logo**: Logo Kemnaker di sisi kiri.
- **Pemisah**: Pemisah garis vertikal berwarna Navy (`#1E3A8A`).
- **Header Teks**: Teks biru Navy cetak tebal (KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA / DIREKTORAT JENDERAL PEMBINAAN PENGAWASAN KETENAGAKERJAAN DAN KESELAMATAN DAN KESEHATAN KERJA / BALAI KESELAMATAN DAN KESEHATAN KERJA SAMARINDA).
- **Baris Kontak**: Alamat, Website, Email, dan Telepon.

### 2. Surat Penawaran (`offering-letter.tsx`)

- **Tujuan Surat**: Format 3 baris terpisah (`Yth. Pimpinan` / `{nama_perusahaan}` / `di Tempat`).
- **Poin Permohonan**: Wajib mempertahankan 6 poin permohonan lengkap.
- **Halaman 2 (Lampiran)**: Tanda tangan 2 kolom (Kiri: Menyetujui Perusahaan, Kanan: Kepala Balai K3 Samarinda). Tanpa tabel paraf dan tanpa box refund.

### 3. Surat Perjanjian Kerja Sama / SPK (`spk.tsx`)

- **Judul Dokumen**: `PERJANJIAN KERJA SAMA` dengan sub-judul `PENDAYAGUNAAN FASILITAS LAYANAN BALAI K3 SAMARINDA`.
- **Pengulangan Header Tabel**: Menggunakan `fixed={true}` pada baris header tabel agar otomatis dicetak ulang di bagian atas saat tabel berlanjut ke halaman baru.
- **Perlindungan Pemotongan Baris**: Menggunakan `wrap={false}` pada setiap baris item, baris total, dan `ListItem` agar teks tidak terbelah di batas halaman.
- **Rincian Bank**: Kolom label menggunakan `w-36` agar teks `c) Nama Rekening` tidak terpotong menjadi `Nama Reken-ing`.

### 4. Surat Perintah Tugas / SPT (`assignment-letter.tsx`)

- **Null Safety Tanggal**: Memiliki fallback tanggal penugasan otomatis (`startDate ?? order.createdAt`) untuk mencegah error `400 Bad Request` saat mencetak atau mempratinjau SPT.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐
│   QR Code       │
│   di PDF        │
└────────┬────────┘
         │ Scan
         ▼
┌─────────────────────────────────────┐
│  Public Route: /verify/{token}      │
│  - No authentication required       │
│  - TanStack Router file-based route │
└────────┬────────────────────────────┘
         │ tRPC Query
         ▼
┌─────────────────────────────────────┐
│  tRPC Public Procedure              │
│  document.verifyDocument            │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Document Query                     │
│  verifyDocumentByToken()            │
│  - Fetch document by token          │
│  - Verify JWT signature             │
│  - Check file integrity (optional)  │
│  - Log verification attempt         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Response                           │
│  {                                  │
│    isValid: boolean,                │
│    document: Document,              │
│    error?: string                   │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 📝 File yang Dibuat/Dimodifikasi

### 1. Frontend - Public Verification Page

**File:** `apps/web/src/routes/verify.$token.tsx`

**Features:**

- Dynamic route parameter `$token`
- Three states: Loading, Error, Success
- Responsive layout dengan Tailwind CSS
- shadcn/ui components
- SEO-friendly dengan custom meta tags

**UI Components:**

- Verification success banner (green)
- Document information card
- Signature details dengan timestamp
- Security information section
- Legal disclaimer (UU ITE)
- Download button untuk dokumen

### 2. Backend - API Enhancement

**File:** `packages/api/src/routers/document.ts`

**Changes:**

```typescript
// Updated response mapping untuk match frontend expectation
verifyDocument: publicProcedure
  .input(z.object({
    token: z.string(),
    checkFileIntegrity: z.boolean().optional().default(false),
  }))
  .query(async ({ input, ctx }) => {
    const result = await Effect.runPromise(
      documentQueries.verifyDocumentByToken(input.token, {
        verifiedByUserId: ctx.user?.id,
        verifiedByIp: ctx.header("x-forwarded-for") || undefined,
        verifiedByUserAgent: ctx.header("user-agent") || undefined,
        checkFileIntegrity: input.checkFileIntegrity,
      })
    );

    return {
      isValid: result.valid,
      document: result.document,
      error: result.error,
      payload: result.payload,
    };
  }),
```

### 3. QR Code URL Update

**File:** `packages/queries/src/document.queries.ts`

**Changes:**

```typescript
// OLD: Backend API route
const verificationUrl = `${appUrl}/api/verify-document/${token}`;

// NEW: Frontend public page
const verificationUrl = `${appUrl}/verify/${token}`;
```

**Impact:** Semua QR code baru akan mengarah ke halaman public, bukan API endpoint.

---

## 🚀 Cara Menggunakan

### 1. Generate Document dengan QR Code

```typescript
// Di tRPC mutation atau service
const signedDocument = await documentQueries.signDocumentWithJWT(
  documentId,
  userId,
  process.env.APP_URL, // e.g., "https://tepian-k3.com"
);

// Result:
// - Document ditandatangani dengan JWT
// - QR code dibuatkan dan di-upload
// - Verification token disimpan di database
// - URL: https://tepian-k3.com/verify/abc123xyz...
```

### 2. User Scan QR Code

1. User scan QR code di PDF menggunakan smartphone
2. Browser membuka `https://tepian-k3.com/verify/{token}`
3. Frontend call tRPC `document.verifyDocument` (public, no auth)
4. Backend verify JWT signature + file integrity
5. Display hasil verifikasi ke user

### 3. Manual Verification

User juga bisa manual copy-paste token:

```
https://tepian-k3.com/verify/abc123xyz...
```

---

## 🔒 Keamanan

### Current Implementation (JWT-based)

✅ **Yang Sudah Ada:**

- HMAC-SHA256 signature untuk document signing
- SHA-256 file hashing untuk integrity check
- Verification logging (IP, user agent, timestamp)
- Token expiration support
- Audit trail lengkap

⚠️ **Limitations:**

- Menggunakan symmetric key (HMAC) bukan asymmetric (RSA/ECDSA)
- **TIDAK** memenuhi standar tanda tangan digital tersertifikasi (UU ITE Pasal 11-12)
- **TIDAK** terintegrasi dengan PSrE (Penyelenggara Sertifikasi Elektronik)
- **TIDAK** menggunakan Trusted Timestamp Authority

### Status Hukum

**✅ COCOK UNTUK:**

- Verifikasi dokumen internal
- Proof of authenticity untuk administrasi
- Anti-tampering verification
- Audit trail untuk compliance

**❌ TIDAK COCOK UNTUK:**

- Dokumen legal yang butuh tanda tangan digital tersertifikasi
- Transaksi yang memerlukan non-repudiasi kuat
- Dokumen yang perlu diajukan ke pengadilan sebagai alat bukti elektronik utama

**Kesimpulan:** Sistem ini **SETARA dengan MagangHub Kemnaker** - yaitu sistem verifikasi dokumen elektronik biasa (Pasal 5 UU ITE), **BUKAN** tanda tangan digital tersertifikasi (Pasal 11-12 UU ITE).

---

## 🧪 Testing

### Manual Testing Checklist

1. **Generate Document dengan QR Code:**

   ```bash
   # Upload dan sign document via tRPC
   # Check QR code generated di storage
   # Verify verification_url di database
   ```

2. **Scan QR Code:**
   - Scan dengan smartphone camera
   - Verify redirect ke `/verify/{token}`
   - Check loading state muncul
   - Verify dokumen detail tampil lengkap

3. **Verification States:**
   - ✅ Valid document → Green success banner
   - ❌ Invalid token → Red error state
   - ⚠️ Expired token → Yellow warning
   - 🔄 Loading → Blue loading spinner

4. **Audit Trail:**
   ```sql
   SELECT * FROM document_verifications
   WHERE document_id = 'xxx'
   ORDER BY created_at DESC;
   ```

### Automated Testing (TODO)

```typescript
// Example E2E test
test("Public verification flow", async () => {
  // 1. Create and sign document
  const doc = await createDocument();
  const signed = await signDocument(doc.id);

  // 2. Visit verification page
  await page.goto(`/verify/${signed.verificationToken}`);

  // 3. Check success state
  await expect(page.getByText("Dokumen Terverifikasi")).toBeVisible();
  await expect(page.getByText(doc.title)).toBeVisible();
});
```

---

## 📊 Database Schema

### documents table

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  document_number VARCHAR(100) UNIQUE NOT NULL,
  verification_token VARCHAR(255) UNIQUE, -- For QR verification
  verification_url TEXT,                 -- Public URL: /verify/{token}
  signature_data TEXT,                   -- JWT signature
  qr_code_url TEXT,                      -- QR code image path
  signed_at TIMESTAMP,
  signed_by_user_id UUID REFERENCES users(id),
  status document_status NOT NULL DEFAULT 'draft',
  ...
);
```

### document_verifications table (Audit Log)

```sql
CREATE TABLE document_verifications (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  verified_by_user_id UUID REFERENCES users(id), -- Null jika anonymous
  verified_by_ip VARCHAR(45),
  verified_by_user_agent TEXT,
  verification_location TEXT,
  is_valid BOOLEAN NOT NULL,
  verification_method VARCHAR(50),    -- 'qr_scan', 'manual', etc.
  verification_notes TEXT,
  created_at TIMESTAMP NOT NULL
);
```

---

## 🔄 Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    DOCUMENT CREATION FLOW                    │
└──────────────────────────────────────────────────────────────┘

1. User uploads PDF
   └─> storageService.upload()

2. Create document record
   └─> documentQueries.createDocument()

3. Sign document dengan JWT
   └─> documentSigningService.createDocumentSignature()
       ├─> Generate SHA-256 hash
       ├─> Sign dengan HMAC-SHA256
       └─> Generate verification token

4. Generate QR code
   └─> QRCode.toDataURL(verificationUrl)
       └─> Upload QR image ke storage

5. Update document dengan signature data
   └─> Save: signatureData, verificationToken, qrCodeUrl

┌──────────────────────────────────────────────────────────────┐
│                    VERIFICATION FLOW                         │
└──────────────────────────────────────────────────────────────┘

1. User scan QR code atau click link
   └─> Navigate to /verify/{token}

2. Frontend fetch verification data
   └─> trpc.document.verifyDocument.useQuery({ token })

3. Backend verify document
   ├─> documentQueries.verifyDocumentByToken()
   │   ├─> Fetch document from DB
   │   ├─> Verify JWT signature
   │   ├─> Check file integrity (optional)
   │   └─> Log verification attempt
   │
   └─> Return {
         isValid: boolean,
         document: Document,
         error?: string
       }

4. Frontend display result
   ├─> Success → Show document details
   ├─> Error → Show error message
   └─> Invalid → Show warning
```

---

## 🎨 UI/UX Features

### Responsive Design

- Mobile-first approach
- Gradient backgrounds untuk visual appeal
- Card-based layout
- Icon system dari Lucide React

### Loading States

- Skeleton loading
- Progress indicator
- Spinner animation
- Smooth transitions

### Error Handling

- Clear error messages dalam Bahasa Indonesia
- Actionable suggestions ("Coba Lagi", etc.)
- Visual error states (red, yellow, green)

### Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation support
- Screen reader friendly

---

## 🚦 Next Steps (Optional Enhancements)

### Phase 2: Security Enhancements

- [ ] Encrypted verification tokens (base64 + AES like Kemnaker)
- [ ] Rate limiting untuk prevent brute force
- [ ] CAPTCHA untuk bot protection
- [ ] Token expiration policy

### Phase 3: Visual Improvements

- [ ] PDF watermark/stamp ("TERVERIFIKASI")
- [ ] Visible QR code di PDF dengan border
- [ ] Signature appearance (nama + timestamp di PDF)
- [ ] Multi-signature support visualization

### Phase 4: Analytics & Monitoring

- [ ] Verification analytics dashboard
- [ ] Geographic distribution map
- [ ] Suspicious activity alerts
- [ ] Export audit logs

### Phase 5: Upgrade to Certified Digital Signature (Jika Diperlukan)

- [ ] Integrasi PSrE (PrivyID, VIDA, dll)
- [ ] Asymmetric cryptography (RSA-2048)
- [ ] Trusted Timestamp Authority (TSA)
- [ ] PAdES-compliant PDF signatures
- [ ] KYC implementation

---

## ❓ FAQ

### Q: Apakah sistem ini legal di Indonesia?

**A:** Ya, untuk **dokumen elektronik biasa** sesuai Pasal 5 UU ITE. Namun **BUKAN** tanda tangan digital tersertifikasi (Pasal 11-12) yang memerlukan integrasi PSrE.

### Q: Apakah dokumen bisa dipalsukan?

**A:** Sangat sulit. JWT signature + SHA-256 hash memastikan:

- Dokumen tidak bisa diubah tanpa invalidate signature
- Token verification unik per dokumen
- Audit trail mencatat semua verifikasi

Namun, siapapun yang punya akses ke `JWT_DOCUMENT_SECRET` secara teoritis bisa membuat signature palsu.

### Q: Bagaimana cara scan QR code?

**A:**

1. Buka camera smartphone
2. Arahkan ke QR code di PDF
3. Tap notifikasi link yang muncul
4. Browser akan buka halaman verifikasi

### Q: Apakah perlu login untuk verifikasi?

**A:** **TIDAK**. Halaman `/verify/{token}` adalah public route. Siapapun bisa verify tanpa akun.

### Q: Berapa lama token valid?

**A:** Default: 10 tahun (untuk dokumen arsip). Bisa diubah di `signDocument()` parameter `expiresIn`.

### Q: Apakah file PDF ikut disimpan?

**A:** Ya, di storage service (MinIO/S3). Tapi hanya hash yang dimasukkan dalam signature, bukan file asli.

---

## 📞 Support

Jika ada pertanyaan atau issue:

1. Check dokumentasi ini terlebih dahulu
2. Review code di files yang disebutkan
3. Check audit log di database untuk debugging
4. Create issue di repository (jika perlu)

---

## 📚 References

- [UU ITE (Undang-Undang ITE)](https://jdih.kominfo.go.id/produk_hukum/view/id/555/t/undangundang+nomor+11+tahun+2008+tanggal+21+april+2008)
- [PP 71/2019 (Penyelenggaraan Sistem dan Transaksi Elektronik)](https://jdih.kominfo.go.id/produk_hukum/view/id/752/t/peraturan+pemerintah+nomor+71+tahun+2019)
- [JWT.io](https://jwt.io/) - JSON Web Token standard
- [QRCode npm package](https://www.npmjs.com/package/qrcode)
- [TanStack Router](https://tanstack.com/router) - File-based routing

---

**Last Updated:** 2026-01-11
**Author:** Claude (Sonnet 4.5)
**Project:** Tepian K3 Document Verification System
