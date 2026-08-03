# Peta Dokumentasi (INDEX)

Selamat datang di repositori dokumentasi **tepian-k3**. Struktur repositori ini dibagi menjadi 4 bagian utama. Gunakan daftar di bawah ini untuk menavigasi dokumentasi yang tersedia.

## 1. Getting Started (Memulai Cepat)

Dokumentasi untuk developer baru yang ingin mengatur environment dan memahami struktur proyek secara high-level.

- [QUICKSTART.md](getting-started/QUICKSTART.md) — Panduan instalasi, environment variables, dan menjalankan aplikasi.
- [ARCHITECTURE.md](getting-started/ARCHITECTURE.md) — Struktur folder, arsitektur monorepo, dan batasan modul.
- [BUSINESS_FLOW.md](getting-started/BUSINESS_FLOW.md) — Penjelasan detail alur transaksi bisnis (kaji ulang, testing, sertifikat).
- [DOMAIN_MAP.md](DOMAIN_MAP.md) — Peta fitur, domain, router, dan permission dalam aplikasi.
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — Referensi schema database (PostgreSQL/Drizzle) dan aturan interaksi.
- [FEATURE_GUIDE.md](FEATURE_GUIDE.md) — Panduan step-by-step menambahkan fitur baru dari database hingga UI.

## 2. Pengujian & Kualitas Kode

Panduan untuk penerapan Test-Driven Development (TDD) dan data _fixtures_.

- [TESTING_GUIDE.md](testing/TESTING_GUIDE.md) — Aturan pengujian dengan Vitest dan PGlite.
- [FIXTURES_REFERENCE.md](testing/FIXTURES_REFERENCE.md) — Cara memanipulasi _mock data_ di dalam pengujian.

## 3. Backend (Server, Database, & API)

Panduan terkait Hono, tRPC, PostgreSQL, Drizzle ORM, dan logika bisnis backend.

- [PATTERNS.md](backend/PATTERNS.md) — Panduan utama untuk arsitektur backend, pola Effect library, `runEffect` error handling.
- [DATABASE.md](backend/DATABASE.md) — Konvensi skema, migrasi, transaksi, UUIDv7, relasi polimorfik.
- [AUTH_AND_PERMISSIONS.md](backend/AUTH_AND_PERMISSIONS.md) — Sistem JWT, role, middleware, dan panduan autentikasi.
- [QR_DIGITAL_SIGNATURE.md](QR_DIGITAL_SIGNATURE.md) — Arsitektur & panduan integrasi Tanda Tangan Digital (TTE) berbasis QR Code.
- [DOCUMENT_VERIFICATION.md](DOCUMENT_VERIFICATION.md) — Panduan verifikasi publik dokumen PDF, Kop Surat resmi, dan layout SPK/Penawaran/SPT.
- [document-signatures-implementation.md](document-signatures-implementation.md) — Dokumentasi alur TTE Pimpinan Perusahaan (`headOfCompanyEmail`) dan pembuatan dokumen PDF (Tagihan, SPK, Penawaran, SPT).
- [CLIENT_SIDE_PDF_IMPLEMENTATION.md](CLIENT_SIDE_PDF_IMPLEMENTATION.md) — Panduan pratinjau & penempelan QR Code berbasis React PDF viewer (`QRSignaturePlacer`).

## 4. Frontend (UI/UX & Routing)

Panduan terkait React, TanStack Router, Shadcn UI, dan styling.

- [DESIGN_GUIDE.md](frontend/DESIGN_GUIDE.md) — Panduan desain UI/UX, warna, typography, layout pattern.
- [ROUTING.md](frontend/ROUTING.md) — Penjelasan struktur folder TanStack Router, route protection.
- [COMPONENTS.md](frontend/COMPONENTS.md) — Panduan komponen spesifik, reusable hooks, dan state management.

## 5. Deployment & DevOps

Panduan untuk mengatur infrastruktur dan environment.

- [ENVIRONMENT.md](deployment/ENVIRONMENT.md) — Penjelasan _.env_ dan penggunaannya.
- [DOCKER.md](deployment/DOCKER.md) — Setup Docker Compose dan panduan container.
- [PRODUCTION_DEPLOYMENT_GUIDE.md](deployment/PRODUCTION_DEPLOYMENT_GUIDE.md) — Panduan lengkap deploy ke production Coolify, checklist, tips aman, dan troubleshooting.
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Panduan berkontribusi untuk developer baru.

---

> **Catatan:** Jika Anda adalah AI Agent, selalu merujuk ke file [`AGENTS.md`](../AGENTS.md) di root directory sebagai panduan aturan yang harus diikuti secara ketat. Semua dokumen usang atau yang tidak lagi digunakan telah dipindahkan ke folder `docs/archive/`.
