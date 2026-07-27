# @tepian-k3/db

Paket ini mengatur koneksi ke database dan manajemen ORM (Drizzle).

## Isi

- `client.ts`: Menginisialisasi koneksi Drizzle ORM ke PostgreSQL (via `postgres.js`).
- Migrasi: File migrasi tersimpan di sini (biasanya melalui `pnpm db:generate`).
- Konfigurasi database utama untuk aplikasi.

## Aturan Penting

Jangan menulis logika *query* secara spesifik di sini. Paket ini hanya bertujuan sebagai *provider* database dan *schema connector*. Logika pengambilan/penulisan data (query) harus berada di `@tepian-k3/queries`.

## Perintah Database

Jalankan perintah ini dari root atau di dalam paket (via `pnpm`):

- `pnpm db:generate` - Men-generate file migrasi dari perubahan di `@tepian-k3/schema`.
- `pnpm db:migrate` - Menjalankan migrasi ke database (Production).
- `pnpm db:push` - Langsung mengaplikasikan skema (HANYA untuk dev).
- `pnpm db:studio` - Membuka GUI Drizzle Studio.
