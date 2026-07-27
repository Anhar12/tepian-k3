# Panduan Best Practice Backup Data Tepian K3

Dokumen ini memberikan panduan best practice mengenai strategi pencadangan (backup) data sistem Tepian K3, yang mencakup data dari database PostgreSQL dan object storage (file unggahan).

## 1. Komponen Utama yang Harus Dibackup

Terdapat dua komponen krusial dalam sistem Tepian K3 yang memerlukan pencadangan rutin:
- **Database (PostgreSQL)**: Menyimpan seluruh data transaksional, pengguna, pesanan, dan konfigurasi sistem.
- **Object Storage (File Uploads)**: Menyimpan dokumen-dokumen penting seperti bukti pembayaran, surat persetujuan, SPK, dan laporan.

## 2. Strategi Pencadangan (Backup Strategy)

### A. Database (PostgreSQL)
Disarankan menggunakan metode pencadangan otomatis dengan kombinasi berikut:
- **Daily Automated Backup**: Melakukan dump data penuh (full backup) setiap hari pada jam dengan lalu lintas rendah (misalnya jam 02:00 pagi).
- **Point-in-Time Recovery (PITR)**: Mengaktifkan *Write-Ahead Logging* (WAL) archiving agar data dapat dikembalikan ke titik waktu tertentu (misalnya sebelum terjadi insiden kesalahan data).
- **Alat yang Direkomendasikan**: `pg_dump` untuk backup harian, dan `pgBackRest` atau `WAL-G` untuk kebutuhan PITR.
- **Penyimpanan**: Simpan file backup database di lokasi fisik atau cloud storage yang terpisah dari server utama (misalnya Amazon S3, Google Cloud Storage, atau server backup lokal terpisah).

### B. Object Storage (File Uploads)
File yang diunggah oleh pengguna harus dilindungi dari kehilangan:
- **Replikasi Otomatis**: Jika menggunakan layanan cloud (seperti S3), aktifkan fitur *Cross-Region Replication* atau *Versioning*.
- **Sync Berkala**: Jika file disimpan di server lokal, gunakan rsync atau cron job untuk menyalin file ke server backup setidaknya sehari sekali.

## 3. Retensi Backup (Jangka Waktu Penyimpanan)

Terapkan aturan retensi untuk menyeimbangkan keamanan data dan biaya penyimpanan:
- **Harian (Daily)**: Simpan 7 hari terakhir.
- **Mingguan (Weekly)**: Simpan 4 minggu terakhir.
- **Bulanan (Monthly)**: Simpan 12 bulan terakhir.
- **Tahunan (Yearly)**: Simpan 5 tahun terakhir (sesuai kebutuhan audit/regulasi).

## 4. Keamanan Backup

Data backup sangat rentan jika jatuh ke tangan yang salah. Terapkan standar keamanan berikut:
- **Enkripsi**: Semua file backup harus dienkripsi (baik saat transit maupun saat disimpan/at-rest).
- **Akses Terbatas**: Hanya personel yang berwenang (misalnya SysAdmin/DevOps senior) yang memiliki akses ke server/lokasi backup.
- **Prinsip 3-2-1**:
  - Memiliki minimal **3** salinan data.
  - Menyimpannya dalam **2** media/format yang berbeda.
  - Menyimpan minimal **1** salinan di lokasi fisik (offsite) yang berbeda.

## 5. Uji Coba Pemulihan (Recovery Testing)

Backup tidak ada gunanya jika tidak bisa dipulihkan.
- Lakukan **simulasi pemulihan (restore test)** setidaknya sebulan atau 3 bulan sekali.
- Verifikasi bahwa database dapat dijalankan dan file dapat diakses dengan normal setelah proses restore.
- Buat dan perbarui *Disaster Recovery Plan* (DRP) yang mendokumentasikan langkah-langkah detail cara memulihkan sistem jika terjadi kegagalan total.

## 6. Contoh Skrip Sederhana Backup Harian (PostgreSQL)

```bash
#!/bin/bash
# Script sederhana cron backup database
BACKUP_DIR="/path/to/backup/dir"
DB_NAME="tepian_k3"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/$DB_NAME-$DATE.sql.gz"

pg_dump -U username -d $DB_NAME | gzip > $FILENAME
# Langkah selanjutnya: Upload $FILENAME ke remote storage
```

Dengan mengimplementasikan strategi di atas, risiko kehilangan data pada aplikasi Tepian K3 dapat diminimalisir secara signifikan.
