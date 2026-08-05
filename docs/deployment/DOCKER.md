# 🐳 Panduan Deployment Docker (Self-Hosted & Local)

Dokumen ini menjelaskan cara membangun, menjalankan, dan me-manage container Docker untuk aplikasi **tepian-k3**, baik untuk kebutuhan pengembangan lokal maupun deployment self-hosted di server/laptop lokal.

---

## 🏗️ 1. Struktur Dockerfile Proyek

Proyek monorepo ini memiliki beberapa `Dockerfile` yang disesuaikan dengan arsitektur target:

| File Dockerfile                                          | Fungsi & Target Lingkungan                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`Dockerfile`](../../Dockerfile)                         | Multi-stage build utama untuk **API Server Backend** (Node 22 + Alpine + pnpm) |
| [`Dockerfile.web`](../../Dockerfile.web)                 | Multi-stage build untuk **Web Frontend** (Vite + Nginx Alpine)                 |
| [`Dockerfile.coolify`](../../Dockerfile.coolify)         | Dockerfile khusus deployment API Server di **Coolify**                         |
| [`Dockerfile.web.coolify`](../../Dockerfile.web.coolify) | Dockerfile khusus deployment Web Frontend di **Coolify**                       |
| [`Dockerfile.drizzle`](../../Dockerfile.drizzle)         | Container terpisah untuk menjalankan **Database Migration** di CI/CD           |

---

## 📦 2. Skenario Deployment Self-Hosted (GHCR + Docker Compose)

Skenario ini digunakan jika Anda ingin me-run aplikasi di server lokal/laptop tanpa perlu meng-compile source code di mesin target (mengunduh image pre-built dari **GitHub Container Registry / GHCR**).

### A. File yang Digunakan

- Configuration template: `.env.docker.example`
- Production compose file: `docker-compose.prod.yml`
- Deployment script: `scripts/deploy-laptop.sh`

---

### B. Langkah-Langkah Deployment Manual

#### Langkah 1: Buat File `.env`

Salin file `.env.docker.example` menjadi `.env` di root direktori proyek:

```bash
cp .env.docker.example .env
```

Sesuaikan variabel penting di `.env`:

```env
# Credentials Database & Redis
POSTGRES_USER=tepian
POSTGRES_PASSWORD=password_rahasia_anda
POSTGRES_DB=tepian_k3
REDIS_PASSWORD=password_redis_anda

# Secrets Auth & Document Signing (Generate dengan: pnpm regenerate:jwt)
JWT_SECRET=super_secret_jwt_minimal_32_karakter
JWT_REFRESH_SECRET=super_secret_refresh_minimal_32_karakter
JWT_DOCUMENT_SECRET=super_secret_doc_minimal_32_karakter

# Image Registry Info
GHCR_USER=rizrmdhn
IMAGE_TAG=latest
LAPTOP_IP=192.168.1.100 # Ganti dengan IP lokal mesin Anda
WEB_PORT=3001
```

#### Langkah 2: Login ke GHCR (Jika Image Membutuhkan Autentikasi)

```bash
docker login ghcr.io -u USERNAME -p GHCR_PAT_TOKEN
```

#### Langkah 3: Unduh Image & Jalankan Container

```bash
# Unduh image terbaru dari GHCR
docker compose -f docker-compose.prod.yml pull

# Jalankan seluruh stack di background (-d)
docker compose -f docker-compose.prod.yml up -d
```

---

### C. Menggunakan Automated Script (`deploy-laptop.sh`)

Proyek ini telah dilengkapi skrip otomatisasi di `scripts/deploy-laptop.sh`:

```bash
# Di terminal Git Bash / Linux / macOS:
./scripts/deploy-laptop.sh
```

Skrip ini akan secara otomatis:

1. Mendeteksi IP lokal mesin.
2. Memeriksa keberadaan `.env`.
3. Melakukan `docker compose pull` dan `up -d`.
4. Menjalankan migrasi database otomatis.

---

## 🛠️ 3. Perintah Operasional Docker Compose

### Melihat Status Container

```bash
docker compose -f docker-compose.prod.yml ps
```

### Melihat Log Aplikasi Realtime

```bash
# Log seluruh container
docker compose -f docker-compose.prod.yml logs -f

# Hanya log API Server
docker compose -f docker-compose.prod.yml logs -f server

# Hanya log Web Frontend
docker compose -f docker-compose.prod.yml logs -f web
```

### Menghentikan Aplikasi

```bash
# Menghentikan tanpa menghapus volume data
docker compose -f docker-compose.prod.yml down

# Menghentikan dan menghapus container beserta orphan
docker compose -f docker-compose.prod.yml down --remove-orphans
```

---

## 🔄 4. Cara Update Aplikasi ke Versi Baru

Setiap kali ada update image baru di GHCR:

```bash
# 1. Unduh image versi terbaru
docker compose -f docker-compose.prod.yml pull

# 2. Re-create container tanpa waktu henti lama
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 3. Jalankan migrasi database jika ada skema baru
docker compose -f docker-compose.prod.yml exec server sh /usr/local/bin/docker-migrate.sh
```

---

## 🚫 5. Aturan Keamanan & Larangan

> [!CAUTION]
>
> - **Jangan Pernah** me-commit file `.env` yang berisi password asli ke Git.
> - **Jangan Gunakan** `docker compose down -v` di production karena akan **MENGHAPUS VOLUME DATA POSTGRESQL & UPLOADS**.
> - Pastikan folder `postgres_data` dan `uploads_data` ter-mount sebagai persistent volumes.
