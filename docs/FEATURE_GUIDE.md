# Panduan Membuat Fitur Baru (Feature Guide)

Dokumen ini berisi panduan *end-to-end* (ujung-ke-ujung) untuk menambahkan fitur baru di dalam sistem **Tepian K3**. Arsitektur proyek menggunakan pola **tRPC + Effect + Drizzle ORM**.

## 1. Tambahkan Schema Database

Langkah pertama adalah mendefinisikan tabel di Drizzle Schema. Schema berada di `packages/db/src/schema/`. Pilih file yang sesuai dengan domain (`platform.ts`, `pengujian.ts`, atau `pelatihan.ts`).

1. Buka file schema yang relevan.
2. Tambahkan tabel menggunakan `pgTable`. Pastikan menggunakan `uuidv7` untuk `id` dan sertakan `deletedAt` untuk soft-delete.
3. Buat skema Zod untuk insert dan select menggunakan `createInsertSchema` dan `createSelectSchema` dari `drizzle-zod`.
4. Jika ada relasi, definisikan di blok `relations`.

*Setelah schema diubah, JANGAN PERNAH gunakan `db:push`.* Selalu gunakan perintah migrasi:
```bash
pnpm db:generate
```

## 2. Buat Fungsi Query (packages/queries)

Semua operasi database harus diabstraksi di dalam folder `packages/queries`.

1. Buat atau buka file query terkait (misal: `packages/queries/src/pelatihan/pelatihan.queries.ts`).
2. Gunakan `Effect.tryPromise` untuk membungkus operasi database.
3. JANGAN GUNAKAN async/await standar dengan `try/catch` di sini. Semua error ditangani oleh Effect.

Contoh fungsi query:
```typescript
import { Effect } from "effect";
import { db } from "@tepian-k3/db/client";
import { users } from "@tepian-k3/db/schema/platform";

export const getUserById = (id: string) => 
  Effect.tryPromise({
    try: () => db.query.users.findFirst({ where: eq(users.id, id) }),
    catch: (error) => new Error(`Gagal mengambil user: ${error}`),
  });
```

> **Catatan Audit**: Jika fungsi ini melakukan *mutasi* (Insert, Update, Delete), Anda **wajib** memanggil fungsi `createAudit` untuk mencatat riwayat perubahan.

## 3. Buat tRPC Router (packages/api)

Selanjutnya, daftarkan fungsi query ke dalam router tRPC. Router diletakkan di `packages/api/src/routers/`.

1. Buat file router atau buka yang sudah ada (misal: `pelatihan.ts`).
2. Gunakan prosedur `protectedProcedure` atau `publicProcedure`.
3. Tambahkan middleware `.use(withPermission("nama_permission"))` jika operasi ini membutuhkan akses spesifik.
4. Gunakan `runEffect` dari `@tepian-k3/utils/effect` untuk mengeksekusi fungsi query dari langkah 2.

Contoh Router:
```typescript
import { router, protectedProcedure } from "../../trpc";
import { withPermission } from "../../middlewares/permission.middleware";
import { runEffect } from "@tepian-k3/utils/effect";
import * as userQueries from "@tepian-k3/queries/platform/user.queries";
import { z } from "zod";

export const userRouter = router({
  getById: protectedProcedure
    .use(withPermission("users.read"))
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await runEffect(userQueries.getUserById(input.id));
    }),
});
```

*Penting:* Jika membuat router baru, pastikan untuk mendaftarkannya di `packages/api/src/routers/<domain>/index.ts` agar masuk ke dalam tree API.

## 4. File Upload (Khusus jika ada form upload)

Jika fitur membutuhkan upload file (seperti gambar profil, dokumen pendukung), JANGAN parse form data secara manual.
Gunakan `formDataProcedure` dari TRPC. File akan otomatis diparsing, dan Anda dapat menyimpannya menggunakan `storageService`.

```typescript
import { formDataProcedure } from "../../middlewares/form-data.middleware";

export const updateAvatar = formDataProcedure
  // ...
```

## 5. Integrasi di Frontend (apps/web)

Sekarang endpoint sudah siap digunakan di frontend (React).

1. Panggil query/mutasi menggunakan React Query via instance TRPC (`trpc.domain.router.action.useQuery`).
2. Gunakan komponen `PermissionGate` jika tombol/aksi hanya boleh dilihat oleh pengguna dengan hak akses tertentu.
3. Pastikan pesan error yang ditampilkan ke user menggunakan **Bahasa Indonesia**.

```tsx
import { trpc } from "@/utils/trpc";
import { PermissionGate } from "@/components/permission-gate";

export function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = trpc.platform.user.getById.useQuery({ id: userId });

  if (isLoading) return <div>Memuat...</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <PermissionGate permission="users.update">
        <button>Edit Profil</button>
      </PermissionGate>
    </div>
  );
}
```

## 6. Jalankan Type Check (Wajib)

Setelah semua selesai, Anda wajib menjalankan *type checking* sebelum mengakhiri pekerjaan. Ini memastikan tidak ada error TypeScript yang terlewat.

```bash
pnpm check-types
```
Jika gagal, perbaiki error yang muncul, maksimal coba perbaiki 2 kali berturut-turut. Jika masih gagal, lapor dan berikan solusi alternatif.
