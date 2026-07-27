# 🚀 Deployment Runbook & Production Guidelines

Dokumen ini berisi panduan operasional wajib bagi setiap engineer yang melakukan deployment ke lingkungan **Production** (tepiank3.tech).

## ⚠️ Perintah Terlarang di Production

Perintah-perintah berikut **DILARANG KERAS** dijalankan dengan `.env` yang mengarah ke database production, karena akan menghapus data secara permanen:

- ❌ `pnpm db:push` (Merusak schema secara paksa tanpa konfirmasi)
- ❌ `pnpm db:reset` (Mereset database dan menghapus semua data)
- ❌ `pnpm db:purge` (Mendrop schema `public` cascade)
- ❌ Menjalankan `drop-schema.ts` secara manual

_(Catatan: Script destruktif sudah diamankan dengan `Production Guard`, namun kebiasaan baik tetap harus dijaga)._

---

## 🛫 Checklist Sebelum Deploy (Pre-flight Check)

Sebelum menekan tombol "Merge" ke branch `main`, pastikan:

1. **GitHub Actions CI (Checks) Hijau ✅**: Pastikan job `ci` dan `migration-check` lulus tanpa error.
2. **Tidak ada Gap Migration**: Jika ada peringatan mengenai _gap index_ pada file `_journal.json`, pastikan itu adalah gap historis yang sudah disetujui, BUKAN gap baru yang akan menyebabkan crash saat Drizzle berjalan di Coolify.
3. **Fitur Lengkap (Code Freeze)**: Jangan push perubahan database jika kode backend/frontend yang mengkonsumsinya belum siap, untuk mencegah schema drift sementara.

---

## 🗄️ Prosedur Backup Database

Sebaiknya ambil snapshot database sebelum melakukan deployment besar (major version / perubahan schema signifikan).

**Via Coolify Dashboard (Direkomendasikan):**

1. Buka dashboard Coolify.
2. Masuk ke resource database `postgresql-database-d3s09uk...`
3. Masuk ke tab **Backups**.
4. Klik tombol **Backup Now**.
5. Tunggu hingga status menunjukkan `Success`.

**Via CLI Manual (Fallback):**
Jika Anda terhubung ke server lewat SSH atau tunnel lokal:

```bash
pnpm db:snapshot
```

File `.sql` akan tersimpan di direktori `packages/db/snapshots/`.

---

## 🔄 Prosedur Rollback jika Deployment Gagal

Jika setelah merge ke `main`, proses deployment di Coolify gagal:

1. **Jangan Panik, Jangan Reset Database!** Coolify secara otomatis membatalkan deployment jika `Pre-deployment command` (migrasi) gagal, sehingga container lama masih menyala.
2. Cek tab **Deployments > Logs** di Coolify untuk melihat alasan gagal.
3. **Jika error karena Schema Drift (Migration Conflict):**
   - Perbaiki file migrasi `.sql` dan `_journal.json` di branch Anda agar sinkron dengan state database production saat ini.
   - Commit perbaikan tersebut dan push kembali ke `main`.
4. **Jika aplikasi terlanjur update tapi bermasalah (Code Bug):**
   - Lakukan `git revert` pada merge commit terakhir.
   - Push ke `main` agar Coolify me-rebuild kode ke versi sebelumnya yang stabil.

---

## 🛠️ Verifikasi State Migrasi di Production

Jika Anda perlu melakukan investigasi, sambungkan Drizzle Studio atau psql ke database production, lalu jalankan query ini untuk melihat riwayat migrasi yang sudah teraplikasi:

```sql
SELECT * FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 10;
```

Bandingkan output query tersebut dengan file `packages/db/src/migrations/meta/_journal.json` di codebase Anda. Pastikan entri terakhir di database cocok dengan file lokal.
