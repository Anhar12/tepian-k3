# 🚀 Quick Start - Testing Document Verification

## Step-by-Step Testing Guide

### 1. Start Development Server

```bash
# Di root monorepo
pnpm dev
```

Pastikan:
- ✅ API Server running di http://localhost:3000
- ✅ Web App running di http://localhost:3001

### 2. Set Environment Variables

Pastikan `.env` sudah ada:

```env
# Application URL (untuk QR code generation)
APP_URL=http://localhost:3001

# JWT Secret untuk document signing
JWT_DOCUMENT_SECRET=your-super-secret-document-jwt-key-min-32-chars

# ... other configs
```

### 3. Create & Sign Document

Ada 2 cara:

#### Option A: Via UI (jika sudah ada upload form)

1. Login ke aplikasi
2. Upload PDF dokumen
3. Click "Sign Document" atau similar button
4. QR code akan ter-generate otomatis

#### Option B: Via tRPC (Manual Testing)

Buka browser console di http://localhost:3001 dan jalankan:

```javascript
// Contoh: Sign dokumen yang sudah ada
const signed = await window.trpc.document.uploadAndSignOrderInvoice.mutate({
  orderId: "xxx-order-id-xxx",
  file: /* File object dari input[type="file"] */
});

console.log("Verification URL:", signed.verificationUrl);
// Output: http://localhost:3001/verify/abc123xyz...
```

### 4. Test Verification Page

#### Option 1: Manual URL Visit

Copy URL dari console dan paste di browser:
```
http://localhost:3001/verify/abc123xyz...
```

Expected result:
- ✅ Loading spinner muncul sebentar
- ✅ Green success banner: "✓ Dokumen Terverifikasi"
- ✅ Document details tampil lengkap
- ✅ Signature information dengan timestamp
- ✅ Legal disclaimer di bawah

#### Option 2: QR Code Scan (Real Test)

1. Generate QR code (sudah otomatis saat sign document)
2. Download PDF yang sudah di-sign
3. Buka PDF di viewer (Adobe, Chrome PDF viewer, etc.)
4. Scan QR code pakai smartphone camera
5. Browser smartphone akan buka verification page

### 5. Test Error Cases

#### Test Invalid Token

Visit:
```
http://localhost:3001/verify/invalid-token-123
```

Expected:
- ❌ Red error state
- ❌ Message: "Dokumen tidak ditemukan"

#### Test Expired Token

1. Set token expiration di database:
```sql
UPDATE documents
SET expires_at = NOW() - INTERVAL '1 day'
WHERE verification_token = 'your-token';
```

2. Visit verification URL

Expected:
- ⚠️ Yellow warning state
- ⚠️ Message: "Verifikasi kedaluwarsa"

### 6. Check Audit Log

Setelah beberapa kali verifikasi, check database:

```sql
-- View verification history
SELECT
  dv.id,
  dv.is_valid,
  dv.verification_method,
  dv.verified_by_ip,
  dv.created_at,
  d.document_number,
  d.title
FROM document_verifications dv
JOIN documents d ON d.id = dv.document_id
ORDER BY dv.created_at DESC
LIMIT 10;
```

Expected result:
- Setiap verification dicatat dengan timestamp
- IP address dan user agent ter-record
- `is_valid` = true untuk successful verification

---

## 🎨 Visual Testing Checklist

### Desktop (Chrome/Firefox/Safari)

- [ ] Loading state: Blue spinner dengan smooth animation
- [ ] Success state: Green gradient background
- [ ] Document card: Shadow dan rounded corners
- [ ] Information grid: 2 columns responsive
- [ ] Buttons: Hover effects working
- [ ] Separator lines: Visible dan aligned

### Mobile (Smartphone Browser)

- [ ] Responsive layout: Stack ke 1 kolom
- [ ] Touch targets: Minimum 44x44px
- [ ] Text readable: Font tidak terlalu kecil
- [ ] QR scan: Camera permission prompt working
- [ ] Download button: File download working

### Tablet (iPad/Android Tablet)

- [ ] Layout balance: Tidak terlalu lebar/sempit
- [ ] Card max-width: 3xl (48rem) terpenuhi
- [ ] Spacing consistent

---

## 🔍 Common Issues & Solutions

### Issue 1: tRPC Query Error "Cannot read property 'document'"

**Cause:** Response dari backend tidak match expectation frontend.

**Solution:** Sudah fixed di `packages/api/src/routers/document.ts` line 124-129. Make sure latest code ter-pull.

### Issue 2: QR Code mengarah ke `/api/verify-document/` bukan `/verify/`

**Cause:** Old QR code generation code.

**Solution:** Sudah fixed di `packages/queries/src/document.queries.ts` line 206. Regenerate QR code untuk dokumen baru.

### Issue 3: Gradient background tidak muncul

**Cause:** Tailwind class `bg-gradient-to-br` typo jadi `bg-linear-to-br`.

**Solution:** Sudah fixed by linter. Restart dev server jika masih issue.

### Issue 4: "Document not found" padahal token valid

**Possible causes:**
1. Database tidak sync (coba `pnpm db:push`)
2. Token salah (copy-paste error)
3. Document sudah di-delete (check `deleted_at` column)

**Debug:**
```sql
SELECT * FROM documents WHERE verification_token = 'your-token-here';
```

### Issue 5: File integrity check gagal

**Cause:** File di storage tidak match dengan hash di signature.

**Solution:**
1. Pastikan file tidak di-modify setelah sign
2. Check storage service configuration
3. Disable integrity check untuk testing: `checkFileIntegrity: false`

---

## 📊 Performance Testing

### Test dengan Multiple Concurrent Requests

```bash
# Install Apache Bench (ab)
# macOS: brew install httpd
# Ubuntu: sudo apt install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3001/verify/your-token-here
```

Expected:
- Response time: < 500ms (95th percentile)
- No failed requests
- Memory stable

### Database Query Performance

```sql
-- Slow query check
EXPLAIN ANALYZE
SELECT * FROM documents
WHERE verification_token = 'your-token';

-- Should use index "documents_verification_token_idx"
```

---

## 🎯 Production Checklist

Before deploy to production:

### Backend
- [ ] `APP_URL` set ke production domain (https://your-domain.com)
- [ ] `JWT_DOCUMENT_SECRET` strong random string (min 32 chars)
- [ ] Rate limiting enabled untuk `/verify/*` route
- [ ] Database indexes created (verification_token, etc.)
- [ ] CORS configured untuk allow public access
- [ ] Logging level set (warn/error only)

### Frontend
- [ ] Error tracking (Sentry/etc) integrated
- [ ] Analytics (GA/etc) integrated untuk verification page
- [ ] PWA cache strategy untuk offline view (optional)
- [ ] SEO meta tags configured
- [ ] Social sharing preview (og:image, etc.)

### Infrastructure
- [ ] CDN enabled untuk static assets
- [ ] Load balancer health check configured
- [ ] Backup strategy untuk database
- [ ] SSL/TLS certificate valid
- [ ] DNS configured untuk custom domain

### Testing
- [ ] E2E test passing
- [ ] Load test passed (1000+ req/min)
- [ ] Mobile devices tested (iOS + Android)
- [ ] Various QR scanners tested
- [ ] Cross-browser compatibility verified

---

## 📈 Monitoring

### Key Metrics to Track

1. **Verification Success Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE is_valid = true) * 100.0 / COUNT(*) AS success_rate
   FROM document_verifications
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Popular Verification Sources**
   ```sql
   SELECT
     verified_by_user_agent,
     COUNT(*) AS count
   FROM document_verifications
   GROUP BY verified_by_user_agent
   ORDER BY count DESC
   LIMIT 10;
   ```

3. **Verification Geographic Distribution**
   ```sql
   SELECT
     verification_location,
     COUNT(*) AS count
   FROM document_verifications
   WHERE verification_location IS NOT NULL
   GROUP BY verification_location
   ORDER BY count DESC;
   ```

### Alerts to Set Up

- ⚠️ Verification success rate < 95%
- ⚠️ Response time > 2 seconds (p95)
- ⚠️ Error rate > 1%
- ⚠️ Database connection failures

---

## 🚀 Next Steps

Setelah basic flow working:

1. **Add Rate Limiting** (prevent abuse)
2. **Encrypt Tokens** (like Kemnaker base64 encrypted)
3. **Add PDF Watermark** (visual "VERIFIED" stamp)
4. **Analytics Dashboard** (verification statistics)
5. **Multi-signature Support** (multiple signers per document)
6. **Upgrade to PSrE** (jika perlu digital signature tersertifikasi)

---

## 📚 Useful Commands

```bash
# Rebuild everything
pnpm build

# Type check
pnpm check-types

# Database migration
pnpm db:push

# View database
pnpm db:studio

# Lint
pnpm lint

# Format
pnpm format
```

---

**Happy Testing! 🎉**

Questions? Check [DOCUMENT_VERIFICATION.md](./DOCUMENT_VERIFICATION.md) untuk detail lengkap.
