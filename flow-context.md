## Alur Transaksi Ringkas

### 1. Order & Review

- Customer buat order → Status: `pending`
- Admin review list order masuk

### 2. Kaji Ulang (Worksheet Dibuat)

- Admin buat worksheet: parameter, bahan, alat, estimasi hari, jumlah tim
- Buat `worksheetItems` dan `worksheetTools`
- Status worksheet: `draft` → `pending_verification`
- **Note**: Worksheet belum terhubung testing (testing belum ada)

### 3. Verifikasi Koordinator

- Koordinator verifikasi kelayakan teknis
- Tunjuk supervisor (`mainSupervisorId`, `accompanyingSupervisorId`)
- Tunjuk teknisi (`worksheetAssignments`)
- Status worksheet: `pending_verification` → `verified`

### 4. Perhitungan Biaya

- Hitung biaya dari worksheet terverifikasi
- Update harga order
- Status order: `pending` → `approved`

### 5. Penawaran & Persetujuan

- Admin upload `offering_document` (surat penawaran)
- Admin upload `cooperation_agreement_template`
- Customer sign & upload `signed_offering_approval`
- Set `order.approvedAt`

### 6. Invoice & Pembayaran

- Admin upload `invoice` + `cooperation_agreement`
- Customer upload `signed_cooperation_agreement` + `proof_of_payment`
- Admin verifikasi → Status order: `approved` → `unpaid` → `paid`

### 7. Testing Record Dibuat (Setelah Bayar)

- Admin buat `testing` record (generate `testingNumber`)
- Sistem buat `testingItems` (satu per `orderItem`)
- **Hubungkan worksheet ke testing**: set `worksheet.testingId`
- Status testing: `start_testing`

### 8. Persiapan Pelaksanaan

- Finalisasi worksheet → Status: `verified` → `ready`/`in_progress`
- Terbitkan dokumen: `worksheet_document`, `spt_document`, `testing_schedule`
- Status testing: `start_testing` → `in_progress`

### 9. Pelaksanaan Pengujian

- Teknisi akses worksheet, lihat items & tools
- Lakukan pengujian, isi `worksheetItem.value`
- Copy hasil ke `testingItem.result`
- Supervisor tambah `worksheetNotes`
- Set `worksheet.endDate` → Status: `in_progress` → `completed`
- Status testing: `in_progress` → `completed`

### 10. Sertifikat & Pengiriman

- Generate `certificate` dari `testingItems`
- Tanda tangan digital (`documentSignatures`)
- Status order: `paid` → `completed` → `delivered`

---

## Key Points

- **Worksheet dibuat PERTAMA** (kaji ulang, sebelum penawaran)
- **Testing record dibuat TERAKHIR** (setelah pembayaran)
- **Worksheet.testingId** = NULL saat dibuat, diisi setelah testing dibuat
- **Worksheet.status**: `draft` → `pending_verification` → `verified` → `ready` → `in_progress` → `completed`
