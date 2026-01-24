## Alur Transaksi Lengkap (Diperbarui)

### Fase 1: Pembuatan Order

1. **Customer membuat order**
   - User memilih parameter dan membuat order dari cart
   - Status order: `pending`
   - Order menunggu review admin

### Fase 2: Review Admin & Daftar Order

2. **Admin mereview order yang masuk**
   - Melihat daftar order yang pending
   - Memeriksa detail order, parameter, jumlah
   - Mempersiapkan untuk review teknis (kaji ulang)

### Fase 3: Kaji Ulang Teknis - Pembuatan Worksheet

3. **Admin membuat worksheet awal**
   - Melakukan review dan konfirmasi:
     - **Parameter** yang dibutuhkan untuk pengujian
     - **Bahan** yang diperlukan
     - **Alat/Peralatan** yang dibutuhkan
     - **Estimasi durasi** (kemungkinan hari yang akan dikerjakan)
     - **Jumlah tim** (total anggota yang dibutuhkan)
   - Membuat worksheet dengan:
     - Daftar parameter
     - Alat yang dibutuhkan (`worksheetTools`)
     - Estimasi jadwal (`startDate`, estimasi `endDate`)
     - Kebutuhan tim
   - Status worksheet: `draft` atau `pending_verification`
   - **CATATAN**: Worksheet ini belum terhubung ke testing karena testing belum dibuat

4. **Admin membuat worksheet items**
   - Untuk setiap parameter yang akan diuji
   - Menentukan lokasi, jumlah
   - Menghubungkan alat yang dibutuhkan via `parameterTools`

### Fase 4: Verifikasi Koordinator

5. **Koordinator mereview dan memverifikasi worksheet**
   - Mereview kelayakan teknis:
     - Spesifikasi parameter
     - Ketersediaan alat
     - Ketersediaan bahan
     - Kelayakan jadwal
     - Kapasitas tim
   - Menunjuk supervisor:
     - `mainSupervisorId` (Supervisor utama)
     - `accompanyingSupervisorId` (Supervisor pendamping)
   - Menunjuk teknisi lab (`worksheetAssignments`)
   - Status worksheet: `pending_verification` → `verified`

### Fase 5: Detail Transaksi & Perhitungan Biaya

6. **Koordinator/Admin menghitung biaya transaksi**
   - Mereview worksheet yang sudah diverifikasi
   - Menghitung total biaya berdasarkan:
     - Parameter dan jumlah
     - Durasi pengujian
     - Anggota tim yang dibutuhkan
     - Penggunaan alat/peralatan
   - Membuat rincian biaya detail
   - Memperbarui harga order jika diperlukan
   - Status order: `pending` → `approved`

### Fase 6: Upload Surat Penawaran

7. **Admin mengupload surat penawaran** (Offering Document)
   - Dokumen mencakup:
     - Parameter pengujian
     - Estimasi jadwal
     - Komposisi tim
     - Rincian total biaya
   - Tipe dokumen: `ORDER`, kategori: `OFFERING_LETTER`
   - Customer dinotifikasi untuk review penawaran

### Fase 7: Persetujuan Customer

8. **Admin mengupload template surat persetujuan** (Cooperation Agreement Template)
   - Template untuk direview dan ditandatangani customer

9. **Customer download, tanda tangan, dan upload** `signed_offering_approval`
   - Customer mereview penawaran
   - Menandatangani dokumen persetujuan
   - Mengupload dokumen yang sudah ditandatangani
   - Timestamp `approvedAt` pada order diset

### Fase 8: Perjanjian & Invoice

10. **Admin mengupload**:
    - `invoice` (Invoice dengan detail pembayaran)
    - `cooperation_agreement` (Surat Perjanjian Kerjasama)
    - Tipe dokumen: `ORDER` dan `LEGAL`

### Fase 9: Pembayaran

11. **Customer mengupload**:
    - `signed_cooperation_agreement` (Surat perjanjian yang sudah ditandatangani)
    - `proof_of_payment` (Bukti pembayaran)

12. **Admin memverifikasi pembayaran**
    - Status order: `approved` → `unpaid` → `paid`

### Fase 10: Pembuatan Testing Record (SETELAH PEMBAYARAN)

13. **Admin membuat record testing** (terhubung ke orderId)
    - Generate `testingNumber` yang unik
    - Menghubungkan ke: `orderId`, `userId`, `companyId`, `testingType`
    - Status testing: `start_testing`
    - **Testing record dibuat setelah pembayaran dikonfirmasi**

14. **Sistem membuat testing items**
    - Satu `testingItem` per `orderItem`
    - Setiap testingItem berisi:
      - `testingId`, `orderItemId`, `parameterId`
      - `locationId`, `quantity`, `price`, `subTotal`
      - `result` (akan diisi saat pengujian)

15. **Worksheet dihubungkan ke testing**
    - Update `worksheet.testingId` untuk menghubungkan worksheet yang sudah ada ke testing yang baru dibuat
    - Worksheet items otomatis terhubung ke testing melalui worksheet

### Fase 11: Finalisasi Worksheet & Persiapan Pelaksanaan

16. **Admin finalisasi worksheet**
    - Update jadwal final jika diperlukan
    - Konfirmasi tim yang ditunjuk
    - Status worksheet: `verified` → `ready` atau `in_progress`

17. **Admin menerbitkan dokumen**:
    - `worksheet_document` (PDF dengan semua detail worksheet)
    - `spt_document` (Surat Perintah Tugas)
    - `testing_schedule` (Konfirmasi jadwal final)
    - Tipe dokumen: `TESTING`, kategori: `WORKSHEET`, `SPT`, `SCHEDULE`
    - Status testing: `start_testing` → `in_progress`

### Fase 12: Pelaksanaan Pengujian

18. **Karyawan yang ditunjuk mengakses worksheet**
    - Melihat `worksheetItems` untuk kebutuhan pengujian
    - Melihat `worksheetTools` untuk peralatan yang dibutuhkan
    - Mereview parameter dan metode pengujian

19. **Teknisi lab melakukan pengujian**
    - Untuk setiap `worksheetItem`:
      - Melakukan pengujian sesuai spesifikasi
      - Mencatat `value` (hasil pengujian)
      - Menambah `note` jika diperlukan
      - Menandai `isReady` sebagai true saat selesai
    - Supervisor menambahkan `worksheetNotes` dengan level severity

20. **Update hasil testing item**
    - Menyalin hasil dari `worksheetItems` ke `testingItem.result`
    - Kedua tabel menyimpan hasil untuk tujuan berbeda:
      - `worksheetItem.value` - nilai pengujian mentah
      - `testingItem.result` - hasil final terformat untuk sertifikat

21. **Menyelesaikan worksheet**
    - Set `worksheet.endDate` saat semua item selesai
    - Set `worksheet.status`: `in_progress` → `completed`
    - Set `worksheet.result` (ringkasan/kesimpulan keseluruhan)

22. **Menyelesaikan testing**
    - Status testing: `in_progress` → `completed`
    - Semua `testingItems` memiliki hasil yang terisi

### Fase 13: Sertifikat & Pengiriman

23. **Admin generate sertifikat**
    - Mengambil data dari `testingItems` yang sudah selesai
    - Generate PDF sertifikat dengan verifikasi QR
    - Tipe dokumen: `TESTING`, kategori: `CERTIFICATE`

24. **User yang berwenang menandatangani sertifikat**
    - Tanda tangan digital via layanan document signing
    - Dicatat dalam `documentSignatures`

25. **Pengiriman**
    - Customer menerima sertifikat yang sudah ditandatangani
    - Status order: `paid` → `completed` → `delivered`
    - Status testing tetap: `completed`

---

## Ringkasan Perubahan Utama

### Alur Proses Utama:

1. **User Order** → 2. **Admin Review List** → 3. **Kaji Ulang (Pembuatan Worksheet)** → 4. **Verifikasi Koordinator** → 5. **Perhitungan Biaya Transaksi** → 6. **Upload Penawaran** → 7-9. **Persetujuan Customer** → 10-12. **Pembayaran** → **13-15. Pembuatan Testing Record** → 16-22. **Pelaksanaan Pengujian** → 23-25. **Sertifikat & Pengiriman**

### Urutan Pembuatan:

1. **Worksheet dibuat PERTAMA** (fase kaji ulang - sebelum penawaran)
2. **Testing record dibuat TERAKHIR** (setelah pembayaran dikonfirmasi)
3. **Worksheet dihubungkan ke testing** setelah testing record dibuat

### Keuntungan Pendekatan Ini:

- **Worksheet sebagai blueprint** untuk perencanaan dan penawaran
- **Testing record hanya dibuat** setelah customer bayar (komitmen pasti)
- **Worksheet dapat digunakan** untuk estimasi sebelum ada testing record
- **Testing record menandakan** pengujian resmi dimulai

### Penambahan Schema yang Diperlukan:

- Tambahkan field `worksheet.testingId` (nullable, diisi setelah testing record dibuat)
- Tambahkan field `worksheet.status` dengan nilai: `draft`, `pending_verification`, `verified`, `ready`, `in_progress`, `completed`
- Field `worksheet.testingId` bisa NULL saat worksheet dibuat untuk kaji ulang
