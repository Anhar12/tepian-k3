# Panduan Deployment Production (Safe Deployment Guide)

Dokumen ini berisi panduan **aman, praktis, dan terstruktur** untuk melakukan deployment aplikasi **tepian-k3** ke lingkungan production (Coolify).

> [!NOTE]
> Panduan ini wajib dibaca oleh **developer junior**, **DevOps**, dan **AI Coding Agent** sebelum dan sesudah melakukan perubahan kode yang berdampak ke lingkungan production.

---

## 🗺️ 1. Arsitektur Production (Gambaran Ringkas)

Aplikasi **tepian-k3** berjalan di infrastruktur **Coolify** berbasis Docker Container dengan alur sebagai berikut:

```text
[Developer / AI Agent]
        │
        ▼ (Push / Pull Request)
[GitHub Repo: rizrmdhn/tepian-k3]
        │
        ▼ (Webhook Trigger)
[Coolify Server]
   ├── 🟢 Web App Container     (tepiank3.tech — Frontend React/Vite)
   ├── 🟢 API Server Container  (api.tepiank3.tech — Backend Hono/tRPC)
   ├── 🗄️ PostgreSQL Database  (Container terpisah di Coolify)
   └── 🔴 Redis Container        (Caching & Session)
```

---

## ✅ 2. Checklist Wajib Sebelum Push ke Production

Sebelum melakukan `git push` atau membuat **Pull Request** ke branch `main`, wajib memastikan poin-poin berikut:

- [ ] **Type Check Lulus**: Jalankan `pnpm check-types` lokal tanpa error.
- [ ] **Unit Tests Lulus**: Jalankan `pnpm test` lokal tanpa error.
- [ ] **Database Migration Siap**: Jika ada perubahan skema database, pastikan file migration SQL sudah dibuat dengan `pnpm db:generate`.
- [ ] **Tidak Ada File `.env`**: File `.env` lokal **JANGAN PERNAH** di-commit (periksa dengan `git status`).
- [ ] **Backup Database Terjadwal/Manual**: Jika PR mengandung file migration database baru (`packages/db/src/migrations/*.sql`), **lakukan backup database terlebih dahulu**.

---

## 💾 3. Cara Backup Database Production (Wajib Sebelum Migration)

Sebelum melakukan migrasi skema database baru di production, lakukan backup manual melalui Coolify Dashboard:

### Langkah-langkah Backup Manual:

1. Buka **Dashboard Coolify**.
2. Pilih Project **tepian-k3** > Environment **production**.
3. Di bawah bagian **Databases**, klik card **`postgresql-database-...`**.
4. Masuk ke tab **Backups** (atau **Scheduled Backups**).
5. Klik tombol **Backup Now**.
6. Tunggu beberapa saat hingga muncul riwayat backup baru dengan status **Completed / Success**.

> [!TIP]
> Pencadangan ini memastikan Anda memiliki _safety net_ jika terjadi insiden data yang tak terduga.

---

## 🚀 4. Cara Deploy Kode Baru ke Production

### A. Deployment Normal (Tanpa Perubahan Skema Database)

1. Push perubahan Anda ke repository fork (`origin/main`).
2. Buat **Pull Request (PR)** dari branch Anda ke `rizrmdhn/tepian-k3:main`.
3. Setelah PR di-merge oleh pemilik repo, **Coolify akan otomatis me-rebuild & me-redeploy** aplikasi.

### B. Deployment dengan Migration Database Baru (Skema Berubah)

1. Lakukan **Backup Database** terlebih dahulu (lihat Bagian 3).
2. Buat dan merge PR ke `main` seperti biasa.
3. Setelah Coolify selesai melakukan build container baru, jalankan perintah migrasi manual:
   - Buka Coolify > Klik aplikasi **Tepian K3 API** (`api.tepiank3.tech`).
   - Masuk ke tab **Terminal** (atau **Execute Command**).
   - Jalankan perintah berikut:
     ```bash
     sh /usr/local/bin/docker-migrate.sh
     ```
   - Tekan **Enter** dan amati log migrasi hingga muncul pesan `Migrations complete.`.

---

## ⚙️ 5. Setup Automatic Migration di Coolify (Skrip Otomatis)

Agar migrasi berjalan otomatis setiap kali ada deployment baru tanpa risiko merusak server:

1. Buka aplikasi **Tepian K3 API** di Coolify.
2. Masuk ke tab **Configuration** > **Deployments** (atau **General Settings**).
3. Cari kolom **Pre-deployment Command**.
4. Masukkan skrip berikut:
   ```bash
   sh /usr/local/bin/docker-migrate.sh
   ```
5. Klik **Save**.

> [!IMPORTANT]
> Skrip `docker-migrate.sh` berjalan dalam satu container terpisah _sebelum_ container aplikasi utama dinyalakan. Jika migrasi gagal, deployment akan dibatalkan otomatis dan server lama tetap berjalan aman.

---

## 🚫 6. LARANGAN KETAT di Production

> [!CAUTION]
> Dilarang keras menjalankan perintah-perintah di bawah ini di server/database production!

| Perintah                               | Alasan Dilarang                                                         |
| -------------------------------------- | ----------------------------------------------------------------------- |
| ❌ `pnpm db:push` / `drizzle-kit push` | Dapat membuang atau mengubah kolom secara acak (_destructive changes_). |
| ❌ `pnpm db:reset`                     | **MENGHAPUS SELURUH TABLE & DATA** di database production!              |
| ❌ `pnpm db:seed`                      | Mengisi data dummy lokal yang bisa merusak konsistensi data production. |
| ❌ `git push --force` ke upstream      | Dapat menghapus riwayat commit yang sudah di-merge oleh tim lain.       |

---

## 🔧 7. Troubleshooting Error Umum Production

| Error / Gejala                                     | Penyebab Utama                                                      | Langkah Solusi                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **HTTP 500 saat pilih parameter/order**            | Skema database production ketinggalan (belum di-migrate).           | Jalankan `sh /usr/local/bin/docker-migrate.sh` di terminal Coolify API. |
| **`sh: pnpm: not found` saat di terminal Coolify** | Container runtime production sengaja dibuat ringan (tanpa pnpm).    | Gunakan skrip bawaan: `sh /usr/local/bin/docker-migrate.sh`.            |
| **`column "xxx" does not exist`**                  | Ada migration SQL baru yang belum berjalan di database.             | Jalankan `sh /usr/local/bin/docker-migrate.sh`.                         |
| **`relation "xxx" does not exist`**                | Tabel baru di database belum dibuat.                                | Jalankan `sh /usr/local/bin/docker-migrate.sh`.                         |
| **Error CORS di Browser Console**                  | Variable `CORS_ORIGIN` di Coolify tidak sesuai dengan URL frontend. | Pastikan `CORS_ORIGIN` di env Coolify diisi `https://tepiank3.tech`.    |

---

## 📋 8. Referensi Cepat (Cheat Sheet)

```bash
# === LOKAL (Sebelum Push) ===
pnpm check-types                      # Wajib lulus type check
pnpm test                             # Wajib lulus unit test
pnpm db:generate                      # Buat file migration jika skema berubah

# === SERVER PRODUCTION (Coolify Terminal API Container) ===
sh /usr/local/bin/docker-migrate.sh   # Jalankan migrasi skema database
```

---

## 🖥️ 9. Deployment Self-Hosted (Tanpa Coolify / Server Lokal)

Jika Anda men-deploy aplikasi di infrastruktur tersendiri (server kantor / laptop / VPS) tanpa menggunakan platform Coolify, manfaatkan **Docker Compose** dan image terkompilasi dari GHCR.

### Langkah Quickstart Self-Hosted:

1. Pastikan Docker Engine dan Docker Compose v2 sudah terinstal.
2. Salin `.env.docker.example` menjadi `.env` di root folder.
3. Edit `.env` dan isi semua password / secret production.
4. Jalankan perintah otomatisasi:
   ```bash
   ./scripts/deploy-laptop.sh
   ```
   Atau jalankan secara manual:
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```

---

## 📊 10. Monitoring & Health Check

Setiap layanan dalam kontainer dilengkapi dengan penguji kesehatan (_health check_):

### Check Status Health Server API

```bash
# Menguji endpoint kesehatan via HTTP
curl http://127.0.0.1:3000/health
```

Jika server berfungsi baik, API akan merespon dengan status JSON `{ "status": "ok" }`.

### Check Log Realtime Production

- **Di Coolify**: Masuk ke aplikasi > Tab **Logs**.
- **Di Docker Self-Hosted**:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f --tail=100
  ```

---

## 🔄 11. Prosedur Pembaharuan Aplikasi (Version Update)

Saat tim merilis fitur baru:

### Di Environment Coolify (Automated)

1. Cukup merge Pull Request yang sudah disetujui ke branch `main`.
2. Coolify akan mendeteksi trigger webhook dan memulai proses build secara otomatis.

### Di Environment Self-Hosted (Manual)

1. Unduh kontainer image terbaru dari GHCR:
   ```bash
   docker compose -f docker-compose.prod.yml pull
   ```
2. Restart kontainer dengan versi baru:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --remove-orphans
   ```
3. Eksekusi migrasi skema jika ada file migration SQL baru:
   ```bash
   docker compose -f docker-compose.prod.yml exec server sh /usr/local/bin/docker-migrate.sh
   ```
