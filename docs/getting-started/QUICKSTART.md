# Panduan Memulai Cepat (Quickstart)

Selamat datang di tepian-k3! Panduan ini akan membantu Anda mengatur environment pengembangan secara lokal dan menjalankan aplikasi.

## 📋 Persyaratan Sistem

Sebelum memulai, pastikan Anda telah menginstal:
- **Node.js** 20.x atau lebih baru
- **pnpm** 8.x atau lebih baru (Jangan gunakan npm atau yarn)
- **PostgreSQL** 14+ (Atau Docker untuk menjalankan PostgreSQL lokal)

## 🚀 Instalasi dan Menjalankan Proyek

### 1. Clone & Install

```bash
# Clone repositori
git clone https://github.com/rizrmdhn/tepian-k3.git
cd tepian-k3

# Install dependencies dengan pnpm
pnpm install
```

### 2. Environment Variables

Buat file `.env` di root direktori dengan menyalin dari `.env.example`:

```bash
cp .env.example .env
```

Pastikan Anda memperbarui konfigurasi di dalam file `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tepian_k3

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=rahasia-jwt-minimal-32-karakter

# Storage (Opsional, gunakan filesystem untuk dev lokal)
STORAGE_PATH=./uploads
```

> **⚠️ Keamanan**: Jangan pernah commit file `.env` ke Git.

### 3. Setup Database

Buat tabel dan jalankan migrasi ke database lokal Anda:

```bash
# Untuk Development lokal (Push schema langsung)
pnpm db:push

# (Opsional) Isi database dengan data awal
pnpm db:seed

# Buka Drizzle Studio (GUI Database di browser)
pnpm db:studio
```

### 4. Menjalankan Pengujian (TDD)

Proyek ini sangat mengandalkan Test-Driven Development. Anda diwajibkan untuk menjalankan tes sebelum melakukan push.

```bash
# Jalankan seluruh pengujian (menggunakan in-memory PGlite)
pnpm test

# Jalankan pengujian untuk fitur/paket tertentu
pnpm test --filter @tepian-k3/queries
```
> Untuk panduan lengkap penulisan tes, lihat [Panduan Pengujian](../testing/TESTING_GUIDE.md).

### 5. Jalankan Development Server

Gunakan perintah ini untuk menjalankan seluruh aplikasi secara serentak (Turborepo akan menangani build dependencies secara otomatis):

```bash
# Jalankan semua aplikasi (Web & Server)
pnpm dev
```

Aplikasi dapat diakses di:
- 🌐 **Web App (Frontend)**: http://localhost:3001
- 🔌 **API Server (Backend)**: http://localhost:3000

## 🔧 Daftar Perintah Penting (Scripts)

```bash
# Development
pnpm dev              # Jalankan semua aplikasi
pnpm dev:web          # Hanya jalankan web app
pnpm dev:server       # Hanya jalankan server

# Build
pnpm build            # Build semua aplikasi dan package

# Quality Check & Testing
pnpm check-types      # Type check (TS) seluruh monorepo
pnpm web:prettier     # Format kode di web app
pnpm lint             # Jalankan ESLint
pnpm test             # Jalankan tes Vitest

# Database & Migrations
pnpm db:push          # Push skema ke database lokal (hanya dev)
pnpm db:generate      # Generate file migrasi (persiapan prod)
pnpm db:migrate       # Jalankan migrasi (production)
pnpm db:reset         # Reset database dan migrasi ulang dari awal

# Workspace
pnpm add <package> -w                       # Tambah dependensi ke root
pnpm add <package> --filter @tepian-k3/web  # Tambah dependensi ke web app
```
