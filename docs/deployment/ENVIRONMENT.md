# Environment Variables & Konfigurasi

Aplikasi ini sangat bergantung pada environment variables untuk berbagai pengaturannya, baik di backend, database, maupun frontend.

## Persyaratan Dasar

Semua pengaturan disimpan dalam file `.env` di root repository. Anda dapat menyalin file template dengan menjalankan:

```bash
cp .env.example .env
```

## Daftar Variabel Utama

### Database (PostgreSQL)

```env
# Koneksi utama ke database menggunakan pooling
DATABASE_URL="postgres://user:password@localhost:5432/tepian_k3"

# Koneksi langsung (bukan pool) untuk migrasi
DIRECT_URL="postgres://user:password@localhost:5432/tepian_k3"
```

### Autentikasi (JWT)

```env
# Kunci rahasia untuk menandatangani token JWT (Wajib diisi, minimal 32 karakter)
JWT_SECRET="super-secret-key-that-is-at-least-32-characters-long"
```

### Konfigurasi Frontend (Web)

```env
# URL publik aplikasi web
VITE_PUBLIC_APP_URL="http://localhost:3001"

# URL ke API Backend (tRPC)
VITE_PUBLIC_API_URL="http://localhost:3000"
```

### Konfigurasi Backend (Server)

```env
# Port tempat server akan berjalan (default: 3000)
PORT=3000

# URL frontend untuk keperluan CORS
CORS_ORIGIN="http://localhost:3001"
```

### 5. Layanan Penyimpanan Pihak Ketiga (MinIO / S3)

```env
# URL publik atau lokal dari MinIO/S3
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="tepian-k3"
```

### 6. Redis (Caching & Antrean)

```env
# Koneksi Redis untuk session/caching dan background jobs
REDIS_URL="redis://localhost:6379"
```

### 7. Email (SMTP)

```env
# Konfigurasi SMTP untuk pengiriman email (Reset password, Notifikasi Order, dll)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-mailtrap-user"
SMTP_PASS="your-mailtrap-pass"
SMTP_FROM="noreply@tepian-k3.com"
```

## Keamanan

> [!WARNING]
> Jangan pernah meng-*commit* file `.env` ke repository Git. Pastikan `.env` terdaftar di `.gitignore`. Jika Anda menambahkan variabel baru yang diperlukan aplikasi, selalu perbarui file `.env.example`.

## Validasi Environment

Sistem memvalidasi keberadaan variabel environment pada saat *runtime* (saat server menyala) menggunakan *Zod*. Jika ada variabel penting yang terlewat, aplikasi akan gagal menyala dengan pesan error yang jelas, mencantumkan variabel mana yang hilang atau tidak valid.
