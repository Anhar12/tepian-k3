# Panduan Pengguna Layanan Pengujian (End-to-End)

Dokumen ini merupakan panduan lengkap penggunaan modul **Layanan Pengujian** di aplikasi K3 Tepian, mencakup seluruh alur operasional mulai dari pelanggan (Customer), manajemen (Back-Office), hingga tim teknis (Operasional Lab/Peralatan).

---

## 1. Alur Pelanggan (Customer)

### 1.1 Pendaftaran dan Pemesanan
1. **Pilih Parameter**: Pelanggan memilih parameter K3 dari halaman `/katalog` (tersedia kategori parameter seperti Fisika, Kimia, dll.).
2. **Submit Pesanan**: Pelanggan melengkapi form pendaftaran dan mengirimkan pesanan pengujian baru.
3. **Pantau Status**: Setelah disubmit, pesanan akan masuk ke halaman `Status Order`. Pelanggan dapat memantau proses kaji ulang dari Balai.

### 1.2 Pembayaran
- Setelah menerima surat penawaran dan menyetujui biaya (termasuk biaya SBM, Bagasi, Masking, dll.), pelanggan melakukan pembayaran dan mengunggah bukti pembayaran.

### 1.3 Pengusulan Tanggal Jadwal
- **Kapan bisa mengusulkan?** Setelah status pembayaran dikonfirmasi (lunas) dan pesanan berada dalam tahap "Menunggu Pelaksanaan".
- **Cara Mengusulkan**: 
  - Pada halaman detail `Status Order`, temukan bagian penjadwalan.
  - Pilih rentang tanggal (Start Date - End Date) yang diinginkan menggunakan kalender yang tersedia.
  - Kirim usulan.
- **Konfirmasi**: Tim Penjadwalan Balai akan meninjau dan menghubungi Pelanggan. Jika disepakati, tanggal resmi pelaksanaan akan muncul di sistem.

### 1.4 Pengunduhan Sertifikat Mandiri
- Setelah pelaksanaan selesai dan hasil analisis (LHU) serta dokumen lainnya diterbitkan, pelanggan dapat mengunduh langsung dari aplikasi.
- **Dokumen yang tersedia**: 
  1. Laporan Hasil Uji (LHU)
  2. Surat Perintah Tugas (SPT)
  3. Berita Acara
  4. Sertifikat Personil / Teknisi (jika diperlukan)
  5. Sertifikat Kalibrasi Alat (jika dilampirkan)

---

## 2. Alur Admin & Manajemen (Back-Office)

### 2.1 Kaji Ulang & Penawaran
- **Review Pesanan**: Admin mengecek kelengkapan data pesanan dari pelanggan di `/back-office/pengujian/kaji-ulang`.
- **Hitung Biaya**: Admin menambahkan komponen biaya seperti Biaya SBM (Standar Biaya Masukan), Biaya Keamanan Data (Masking), dan Biaya Bagasi Alat jika diperlukan.
- **Penerbitan Penawaran**: Setelah kaji ulang selesai, penawaran diterbitkan untuk di-Approve oleh Kepala Balai.

### 2.2 Approval Kepala Balai
- Kepala Balai menggunakan satu tombol aksi (Action Button) terpadu di *dashboard* untuk memberikan `Approval` atas dokumen kaji ulang atau penawaran tanpa harus membuka banyak halaman.

### 2.3 Konfirmasi Pembayaran & Penolakan
- Bendahara meninjau bukti bayar pelanggan.
- Jika bukti pembayaran ditolak (misalnya jumlah tidak sesuai atau buram), Bendahara wajib memberikan **Catatan Penolakan** sehingga pelanggan tahu alasan penolakan dan dapat memperbaiki unggahan mereka.

### 2.4 Manajemen Penjadwalan
- **Tinjauan Usulan Pelanggan**: Tim Penjadwalan melihat usulan rentang tanggal dari pelanggan di `/back-office/pengujian/jadwal`.
- **Pengecekan Konflik**: Menggunakan Kalender Berwarna untuk memantau ketersediaan pegawai dan mendeteksi bentrok jadwal (Filter Bentrok).
- **Konfirmasi (Terima/Tolak)**: Tim admin akan menghubungi pelanggan secara manual. 
  - Jika **Diterima**: Admin mengeklik "Terima" di sistem. Tanggal pelaksanaan *worksheet* akan diperbarui otomatis, dan rekam jejak persetujuan akan tercatat sebagai *Manual Log* di linimasa.
  - Jika **Ditolak**: Admin menginstruksikan pelanggan via telepon untuk mengajukan ulang tanggal baru, dan menolak usulan di sistem.

---

## 3. Alur Operasional & Tim Teknis

### 3.1 Manajemen Alat & Pengembalian Massal
- **Peminjaman Alat**: Teknisi dipinjamkan alat untuk berangkat ke lokasi pelanggan.
- **Pengembalian Alat Batch (Return Tools)**: Setelah selesai bertugas, staf inventaris dapat mengembalikan alat secara massal melalui dialog pengembalian batch di dashboard alat.
  - Staf dapat mengisi status kondisi fisik setiap alat sekaligus sebelum menyimpannya kembali ke gudang (Inventory).

### 3.2 Stok Bahan Total
- Pemantauan stok bahan kimia / habis pakai di laboratorium.
- Admin Gudang dapat melihat peringatan jika stok menipis dan mengkalkulasikan kebutuhan bahan untuk jumlah pesanan pengujian yang akan datang.

### 3.3 Impor & Ekspor Data Master
- Data master (seperti daftar alat, daftar parameter, tarif, dll.) kini dapat dikelola lebih cepat menggunakan fitur *Import/Export Excel* di `/back-office/pengujian/import-export`.
- **Cara Import**: 
  - Unduh template Excel yang tersedia.
  - Isi data sesuai format.
  - Unggah file Excel ke dalam sistem. Data baru akan ditambahkan, dan data lama yang cocok akan diperbarui (*upsert*).
- **Cara Export**: Klik tombol Ekspor untuk mengunduh seluruh data dalam bentuk `.xlsx`.

---
*Catatan: Rincian teknis implementasi (skema, kueri database) untuk fitur-fitur ini didokumentasikan di dalam `PENGUJIAN_TERJADWAL_IMPLEMENTATION.md`.*
