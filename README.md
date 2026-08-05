# tepian-k3

[![CI Status](https://github.com/rizrmdhn/tepian-k3/workflows/CI/badge.svg)](https://github.com/rizrmdhn/tepian-k3/actions)

A modern, type-safe TypeScript monorepo built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack). Powered by **Turborepo** for blazing-fast builds and **pnpm workspaces** for efficient dependency management.

---

## 📖 Peta Dokumentasi

Semua dokumentasi untuk developer dan AI Agent kini disusun secara terpusat untuk kemudahan akses dan kelengkapan informasi.

👉 **Silakan mulai dari [docs/INDEX.md](docs/INDEX.md) untuk menjelajahi semua panduan proyek.** 👈

**Sorotan Cepat:**

- 🚀 [Peta Deployment (Overview)](docs/deployment/DEPLOYMENT_OVERVIEW.md) — Ringkasan opsi & panduan deployment.
- ⚡ [Panduan Memulai Cepat (Quickstart)](docs/getting-started/QUICKSTART.md) — Instalasi lokal, `.env`, dan skrip npm.
- 🏗️ [Panduan Arsitektur (Architecture)](docs/getting-started/ARCHITECTURE.md) — Struktur monorepo dan aturan modul.
- 🐳 [Panduan Docker & Self-Hosted](docs/deployment/DOCKER.md) — Deployment menggunakan Docker Compose & GHCR.
- 🌐 [Panduan Production Coolify](docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md) — Deployment ke server produksi Coolify.
- 🤖 [AGENTS.md](AGENTS.md) — Aturan wajib yang dibaca oleh sistem AI Agent.

---

## ✨ Fitur Utama

- 🔒 **End-to-end type safety** - Dari database hingga UI dengan tRPC.
- ⚡ **Lightning-fast builds** - Turborepo caching dan eksekusi paralel.
- 📄 **PDF & Document Engine** - Pembuatan Surat Penawaran, SPK, SPT, dan Tagihan secara otomatis menggunakan `@react-pdf/renderer` dengan layout & header berulang presisi.
- 🔏 **QR & TTE Signature** - Penempelan Tanda Tangan Digital (QR Code) berbasis JWT pada PDF dengan posisi dinamis melalui canvas editor (`QRSignaturePlacer`).
- 📦 **Monorepo architecture** - Pembagian paket terpusat (namespace `@tepian-k3/*`).
- 🎯 **File-based routing** - TanStack Router dengan dukungan penuh TypeScript.
- 🗄️ **Type-safe ORM** - Drizzle ORM dengan PostgreSQL dan UUIDv7.
- 📱 **PWA ready** - Progressive Web App dengan offline support.
- 🎨 **Modern UI** - shadcn/ui + TailwindCSS.
- 🔧 **DX optimized** - Git hooks, ESLint, Prettier, hot reload.

---

## 🚀 Perintah Dasar

```bash
# Setup environment (pilih salah satu)
cp .env.example .env            # Untuk dev lokal
cp .env.docker.example .env     # Untuk Docker / Self-hosted

# Jalankan dev server lokal (web :3001, server :3000)
pnpm dev

# Periksa type check seluruh monorepo
pnpm check-types

# Eksekusi database migration
pnpm db:generate
pnpm db:migrate
```

---

**Built with ❤️ using Better-T-Stack**
