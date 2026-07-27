# @tepian-k3/schema

Paket ini berisi seluruh definisi skema database (Drizzle Schema) dan tipe validasi (Zod Schemas) yang digunakan di seluruh aplikasi.

## Struktur

- `src/schema/`: Berisi file deklarasi skema tabel database dengan Drizzle ORM (contoh: `users.ts`, `orders.ts`).
- `src/zod/`: Berisi skema validasi Zod yang dapat di-share antara frontend dan backend. Seringkali skema Zod ini di-generate dari skema Drizzle (menggunakan `drizzle-zod`).

## Konvensi

1. **UUIDv7**: Gunakan `uuidv7()` (dari pustaka `uuid`) untuk semua *primary key* (ID) di setiap tabel, alih-alih `uuidv4()` atau *auto-increment*.
2. **Soft Delete**: Sebagian besar tabel harus mengimplementasikan kolom `deletedAt` (soft delete) untuk mencegah kehilangan data historis.
3. **Audit Trails**: Mutasi data disarankan memiliki log ke *audit table*.
4. **Relasi (Relations)**: Definisikan relasi secara eksplisit di file yang sama dengan tabel atau di file terpisah jika sirkular, agar ORM (Drizzle) mengetahui hubungan antar entitas.

Gunakan paket ini sebagai "sumber kebenaran tunggal" (*Single Source of Truth*) untuk semua tipe dan entitas di aplikasi tepian-k3.
