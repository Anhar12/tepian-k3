# 🔑 Panduan Environment Variables & Konfigurasi

Dokumen ini berisi panduan lengkap seluruh variabel lingkungan (_environment variables_) yang digunakan dalam proyek **tepian-k3**, baik untuk lingkungan lokal (Development), Docker, maupun Production.

---

## 📋 File Template Environment

Proyek ini menyediakan 2 file template konfigurasi dasar:

1. **`.env.example`**: Template utama untuk pengembangan lokal (`pnpm dev`).
2. **`.env.docker.example`**: Template khusus untuk deployment berbasis Docker (`docker-compose.prod.yml`).

---

## ⚡ Panduan Cepat Setup

### Development Lokal

```bash
cp .env.example .env
```

### Docker / Production

```bash
cp .env.docker.example .env
```

> [!WARNING]
> File `.env` berisi rahasia kredensial dan **JANGAN PERNAH** di-commit ke Git. Pastikan `.env` terdaftar di `.gitignore`.

---

## 📊 Tabel Ringkasan Variabel Lingkungan

| Nama Variabel                   | Wajib?        | Default Dev             | Keterangan & Aturan                                        |
| ------------------------------- | ------------- | ----------------------- | ---------------------------------------------------------- |
| `NODE_ENV`                      | ✅ Wajib      | `development`           | Options: `development`, `production`, `test`               |
| `POSTGRES_URL` / `DATABASE_URL` | ✅ Wajib      | `postgresql://...`      | URI Koneksi PostgreSQL                                     |
| `JWT_SECRET`                    | ✅ Wajib      | —                       | Kunci rahasia JWT Access Token (min 32 kar)                |
| `JWT_REFRESH_SECRET`            | ✅ Wajib      | —                       | Kunci rahasia JWT Refresh Token (min 32 kar)               |
| `JWT_DOCUMENT_SECRET`           | ✅ Wajib      | —                       | Kunci rahasia penandatanganan TTE PDF                      |
| `VITE_SERVER_URL`               | ✅ Wajib      | `http://localhost:3001` | URL publik backend/proxy untuk request browser             |
| `CORS_ORIGIN`                   | ✅ Wajib      | `http://localhost:3001` | URL frontend yang diizinkan oleh backend CORS              |
| `SERVER_PORT` / `PORT`          | ○ Opsional    | `3000`                  | Port tempat backend Hono berjalan                          |
| `STORAGE_TYPE`                  | ⚠️ Disarankan | `filesystem`            | Options: `filesystem`, `s3`, `minio`                       |
| `EMAIL_PROVIDER`                | ⚠️ Disarankan | `smtp`                  | Options: `smtp`, `gmail`, `sendgrid`, `resend`, `ethereal` |
| `MEMURAI_HOST` / `REDIS_HOST`   | ⚠️ Disarankan | `localhost`             | Host Server Redis                                          |
| `MEMURAI_PORT` / `REDIS_PORT`   | ⚠️ Disarankan | `6379`                  | Port Server Redis                                          |
| `DOCUMENT_QR_EXPIRATION`        | ○ Opsional    | `10y`                   | Masa berlaku QR Code TTE (contoh: `10y`, `1y`, `30d`)      |

---

## 🔍 Detail Kategori Variabel Lingkungan

### 1. Database (PostgreSQL)

```env
# URL koneksi utama PostgreSQL (menggunakan Drizzle ORM)
POSTGRES_URL="postgresql://tepian:password@localhost:5432/tepian_k3"
```

### 2. Autentikasi (JWT & Security)

Seluruh token rahasia dapat di-generate otomatis menggunakan skrip bawaan:

```bash
pnpm regenerate:jwt
```

```env
# Kunci rahasia Access Token (15 menit default)
JWT_SECRET="ganti_dengan_string_random_minimal_32_karakter"

# Kunci rahasia Refresh Token (30 hari default)
JWT_REFRESH_SECRET="ganti_dengan_string_random_minimal_32_karakter"

# Kunci rahasia Reset Password Token
JWT_RESET_PASSWORD_SECRET="ganti_dengan_string_random_minimal_32_karakter"

# Durasi Expired Token
JWT_ACCESS_TOKEN_EXPIRY="15m"
JWT_REFRESH_TOKEN_EXPIRY="30d"
```

### 3. Penandatanganan Dokumen & QR Code (TTE)

```env
# Kunci rahasia utama untuk menandatangani dokumen PDF (SPK, Tagihan, Sertifikat)
JWT_DOCUMENT_SECRET="ganti_dengan_string_random_minimal_32_karakter"

# Base URL untuk halaman verifikasi QR Code
DOCUMENT_VERIFICATION_BASE_URL="http://localhost:3001/verify"

# Masa berlaku default QR Code
DOCUMENT_QR_EXPIRATION="10y"
```

### 4. Frontend & Communication (Vite & CORS)

```env
# URL API tempat browser mengirim request tRPC/HTTP
# PENTING: Variabel VITE_* di-bake langsung ke bundle JS pada saat build time!
VITE_SERVER_URL="http://localhost:3001"

# URL Frontend yang diizinkan melakukan request ke Server (CORS Header)
CORS_ORIGIN="http://localhost:3001"
```

### 5. Media & Storage Service

```env
# Jenis penyimpanan berkas
STORAGE_TYPE="filesystem" # Pilihan: filesystem, s3, minio

# Konfigurasi jika menggunakan filesystem lokal
UPLOADS_DIR="uploads"
BASE_URL="http://localhost:3001"

# Konfigurasi jika menggunakan S3 / MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="tepian-k3"
```

### 6. Email Notification Service

```env
# Jenis provider email
EMAIL_PROVIDER="smtp" # Pilihan: smtp, gmail, sendgrid, resend, ethereal

# Konfigurasi SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="user@example.com"
SMTP_PASSWORD="app-password-anda"
EMAIL_FROM="noreply@tepiank3.tech"
```

---

## ⚙️ Validasi Runtime Environment (Zod)

Backend menggunakan **Zod Schema** untuk memvalidasi keberadaan dan format variabel lingkungan saat pertama kali server menyala (`apps/server/src/index.ts`).

Jika ada variabel **wajib** yang hilang atau tidak sesuai format, server akan **langsung gagal me-booting** dan memberikan pesan kesalahan yang jelas di konsol/log:

```text
❌ Invalid environment variables:
  - JWT_SECRET: String must contain at least 32 character(s)
  - POSTGRES_URL: Required
```
