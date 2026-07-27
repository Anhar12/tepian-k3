# @tepian-k3/queries

Paket ini menampung seluruh logika interaksi dengan database (query) yang menggunakan pendekatan fungsional dengan `Effect.ts`.

## Prinsip Desain

- **Abstraksi Database**: Semua interaksi dengan `db` diisolasi di paket ini.
- **Effect Pattern**: Semua fungsi database dibungkus menggunakan `Effect.tryPromise` untuk *error handling* yang eksplisit dan *dependency injection*.
- **Murni dan Terisolasi**: Fungsi di sini bersifat *stateless* dan harus dapat diuji secara mandiri (terutama menggunakan database in-memory seperti PGlite).

## Struktur Kode

Setiap file difokuskan pada satu entitas (misal: `user.queries.ts`, `order.queries.ts`).

```typescript
// Contoh pola penulisan:
import { Effect } from "effect";
import { db } from "@tepian-k3/db/client";

export const getById = (id: string) =>
  Effect.tryPromise({
    try: async () => {
      const result = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id),
      });
      if (!result) throw new Error("Data tidak ditemukan");
      return result;
    },
    catch: (error) => new TRPCError({ 
      code: "NOT_FOUND", 
      message: error instanceof Error ? error.message : "Gagal mengambil data" 
    }),
  });
```

## Pengujian

Semua fungsi di sini **wajib** dites menggunakan Vitest. Helper database dan *fixtures* telah disediakan di folder `__tests__/helpers/`. 
Lihat `docs/testing/TESTING_GUIDE.md` untuk panduan lengkap penulisan test.
