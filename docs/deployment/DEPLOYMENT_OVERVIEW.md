# 🚀 Panduan Ringkas Deployment (Deployment Overview)

Dokumen ini adalah **pintu masuk utama** untuk memahami bagaimana aplikasi **tepian-k3** di-deploy ke berbagai lingkungan.

> [!NOTE]
> Wajib dibaca oleh **developer junior**, **DevOps**, dan **AI Agent** sebelum melakukan rilis atau konfigurasi infrastruktur.

---

## 🗺️ Peta Opsi Deployment

Aplikasi **tepian-k3** mendukung 2 metode utama deployment:

```text
                                  ┌────────────────────────┐
                                  │  Pilihan Deployment    │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
     🌐 1. Coolify (Production Utama)                    💻 2. Self-Hosted / Laptop
     - Otomatis via GitHub Webhook                       - Manual via Docker Compose
     - Multi-container (Web, Server, DB, Redis)          - Menggunakan image pre-built GHCR
     - Panduan: PRODUCTION_DEPLOYMENT_GUIDE.md           - Panduan: DOCKER.md
```

---

## 🛠️ Perbandingan Ringkas 2 Metode Deployment

| Fitur               | 🌐 Coolify (Production)                                          | 💻 Self-Hosted / Laptop                     |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| **Tujuan**          | Lingkungan Live Utama (`tepiank3.tech`)                          | Demokrasi Lokal / Server Kantor / Staging   |
| **Triggers**        | Push ke branch `main`                                            | Jalankan skrip `./scripts/deploy-laptop.sh` |
| **Build Location**  | Remote Coolify Server                                            | GitHub Actions (GHCR)                       |
| **Image Registry**  | Built-in Coolify Builder                                         | `ghcr.io/rizrmdhn/tepian-k3-*`              |
| **SSL / HTTPS**     | Otomatis via Let's Encrypt / Traefik                             | Opsional (HTTP port 3001 default)           |
| **Dokumen Panduan** | [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) | [DOCKER.md](DOCKER.md)                      |

---

## ✅ Checklist Wajib Sebelum Deploy (Semua Metode)

Sebelum me-release kode ke lingkungan manapun:

1. **Type Check**: Pastikan `pnpm check-types` tidak ada error.
2. **Unit Tests**: Pastikan `pnpm test` lulus 100%.
3. **Database Migrations**:
   - Jika skema database berubah, jalankan `pnpm db:generate`.
   - **JANGAN PERNAH** me-commit file `.env` lokal ke Git.
4. **Environment Variables**:
   - Pastikan variabel baru sudah ada di `.env.example` dan `.env.docker.example`.

---

## 🛡️ Best Practice Keamanan & Data

1. **Rahasia JWT**: Gunakan token rahasia minimal 32 karakter (`pnpm regenerate:jwt`).
2. **Database Migration**:
   - Production **HARUS** menggunakan migrasi SQL (`docker-migrate.sh`).
   - ❌ **DILARANG KERAS** menggunakan `pnpm db:push` atau `pnpm db:reset` di production!
3. **Backup Database**: Selalu buat backup manual di Coolify sebelum menjalankan migrasi skema baru.

---

## 📚 Dokumen Terkait

- 📄 [ENVIRONMENT.md](ENVIRONMENT.md) — Panduan lengkap semua variabel lingkungan (`.env`).
- 📄 [DOCKER.md](DOCKER.md) — Panduan deployment Docker Compose & GHCR.
- 📄 [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) — Panduan deployment Coolify & troubleshooting.
