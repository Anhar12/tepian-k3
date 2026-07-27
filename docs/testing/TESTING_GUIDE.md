# Panduan Pengujian (Testing Guide)

Proyek tepian-k3 menggunakan metodologi Test-Driven Development (TDD) untuk menjamin kualitas kode, khususnya pada operasi database dan logika bisnis.

## Teknologi Pengujian

- **Framework**: Vitest (sepenuhnya kompatibel dengan API Jest).
- **In-Memory Database**: PGlite (`@electric-sql/pglite`). Ini adalah versi WASM dari PostgreSQL yang berjalan sepenuhnya di memori. Tidak membutuhkan Docker saat menjalankan pengujian.
- **ORM**: Drizzle ORM.

## Cara Menjalankan Pengujian

```bash
# Menjalankan seluruh pengujian di semua paket
pnpm test

# Menjalankan pengujian spesifik untuk satu paket (misalnya queries)
pnpm test --filter @tepian-k3/queries

# Menjalankan pengujian dalam mode watch (saat development)
pnpm test:watch --filter @tepian-k3/queries
```

## Struktur File Pengujian

Pengujian biasanya diletakkan di dalam folder `__tests__` yang berdekatan dengan kode sumber, mengikuti pola nama `*.test.ts`.

Contoh: `packages/queries/src/__tests__/pengujian/order.queries.test.ts`

## Pola Dasar Penulisan (Best Practices)

### 1. Inisialisasi Database (Wajib)

Selalu impor dan gunakan `getSharedTestDb()` dan `truncateAllTables()` dari helpers. **Jangan** memanggil `createIsolatedTestDb()` di setiap tes karena sangat lambat dan memakan banyak memori.

```typescript
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { db } from "@tepian-k3/db/client"; // ini akan dimock
import { vi } from "vitest";

// Wajib mock client database asli
vi.mock("@tepian-k3/db/client", () => ({
  db: getSharedTestDb(),
}));

describe("Fitur Order", () => {
  beforeAll(async () => {
    // Pastikan schema terinisialisasi
    await getSharedTestDb(); 
  });

  beforeEach(async () => {
    // Bersihkan semua data sebelum setiap tes untuk menjaga isolasi
    await truncateAllTables(getSharedTestDb());
  });

  it("seharusnya berhasil melakukan operasi X", async () => {
    // ... tes di sini
  });
});
```

### 2. Menggunakan Fixtures untuk Mock Data

Fixtures secara otomatis menangani dependencies seperti *foreign keys* (misal: jika ingin membuat Order, fixture otomatis akan membuat User dan Company terlebih dahulu).

```typescript
import { createMockUserAndCompany, createMockOrderAndWorksheet } from "../helpers/fixtures";

it("seharusnya dapat membuat order", async () => {
  // 1. Setup mock data
  const { user, company } = await createMockUserAndCompany(db);
  
  // 2. Eksekusi fungsi
  const result = await runEffect(
    orderQueries.createOrder({
      userId: user.id,
      companyId: company.id,
      status: "pending",
    })
  );
  
  // 3. Verifikasi
  expect(result.id).toBeDefined();
  expect(result.status).toBe("pending");
});
```

### 3. Menguji Skenario Error (Effect Pattern)

Karena aplikasi kita menggunakan pola *Effect*, error (biasanya berupa `TRPCError`) dilempar sebagai *Exception* dan bukan sekadar return value di dalam `runEffect(Effect.tryPromise(...))`.

Untuk memverifikasi error, gunakan `rejects.toThrow()`.

```typescript
it("seharusnya melempar error NOT_FOUND jika data tidak ada", async () => {
  const fakeId = uuidv7();

  // Memverifikasi fungsi melempar error TRPCError
  await expect(
    runEffect(orderQueries.getById(fakeId))
  ).rejects.toThrow(/tidak ditemukan/i); 
  // Gunakan regex untuk mencocokkan pesan bahasa Indonesia
});
```

## Anti-Pattern (Jangan Dilakukan)

1. ❌ **Menyisipkan (insert) ke tabel anak tanpa tabel induk**: PGlite menerapkan aturan *foreign key constraints* dengan ketat. Anda akan mendapatkan error database. Selalu gunakan helper di `fixtures.ts`.
2. ❌ **Tidak memanggil `truncateAllTables`**: Ini akan menyebabkan data bocor (*leak*) antar tes dan dapat menyebabkan error *duplicate primary key*.
3. ❌ **Tidak membungkus fungsi `Effect` dengan `runEffect` di tes**: Pemanggilan *Effect* (seperti `Effect.tryPromise`) hanya mendefinisikan komputasi. Anda perlu menjalankannya agar *Promise* dievaluasi.
4. ❌ **Mengabaikan soft-delete**: Ingat, jika data sudah dihapus, field `deletedAt` akan terisi. Pengujian `getById` Anda untuk item yang dihapus harus memverifikasi bahwa ia mengembalikan error `NOT_FOUND`.

Lihat juga: [Referensi Fixtures](FIXTURES_REFERENCE.md)
