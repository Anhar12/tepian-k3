# Panduan Database (PostgreSQL + Drizzle ORM)

Panduan ini mencakup konvensi skema, migrasi, transaksi, UUIDv7, relasi polimorfik, dan panduan upload file di aplikasi tepian-k3.

---

## 1. Konvensi Skema (Schema Conventions)

### A. Primary Key (UUIDv7)
Gunakan `uuidv7()` untuk semua tabel baru agar performa indexing optimal dan data terurut secara kronologis.

```typescript
import { uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

export const myTable = createTable("my_table", {
  id: uuid("id").primaryKey().notNull().$default(() => uuidv7()),
});
```

### B. Timestamps & Soft Delete
Semua tabel wajib menyertakan kolom `createdAt`, `updatedAt`, dan `deletedAt`. Di kode, Anda dapat menggunakan fungsi penyebaran `...timestamps` (jika tersedia) atau mendefinisikan secara eksplisit.
Data yang dihapus **tidak boleh** benar-benar dihapus dari tabel (hard delete), melainkan kolom `deletedAt` diisi dengan timestamp saat ini.

### C. Unique Index Constraint dengan Kondisi Soft Delete
Indeks unik di Drizzle ORM harus mengabaikan baris yang di-soft-delete menggunakan klausa `where`.

```typescript
uniqueIndex("name_idx")
  .on(table.name)
  .where(sql`${table.deletedAt} IS NULL`)
```

---

## 2. Migrasi Database

Saat memodifikasi struktur database, pastikan urutan migrasi tidak merusak data.

- **Development Push**: Gunakan `pnpm db:push` untuk menyinkronkan skema database lokal secara cepat tanpa membuat file migrasi baru (hanya di lingkungan development).
- **Production Build / Standard**: Gunakan `pnpm db:generate` untuk membuat file SQL migrasi, diikuti dengan `pnpm db:migrate` untuk mencatat migrasi. Jangan pernah mengubah isi file migrasi yang sudah pernah diaplikasikan di production.
- **Conflict Recovery**: Jika file migrasi bentrok di repositori git, jalankan `pnpm db:reset` untuk mereset database lokal dan menerapkan ulang seluruh file migrasi dari awal.

---

## 3. Transaksi (Transactions)

Jika ada operasi mutasi (insert/update/delete) yang menyentuh lebih dari satu tabel dan bersifat bergantung satu sama lain, Anda **WAJIB** menggunakan transaksi database.

```typescript
import { Effect } from "effect";
import { db } from "@tepian-k3/db/client";

Effect.tryPromise(() =>
  db.transaction(async (tx) => {
    // 1. Insert parent
    const [parent] = await tx.insert(parents).values({...}).returning();
    
    // 2. Insert child
    await tx.insert(children).values({ parentId: parent.id, ... });
    
    return parent;
  })
);
```

---

## 4. Relasi Polimorfik (Polymorphic Relations)

Di Drizzle ORM, relasi polimorfik diimplementasikan dengan dua kolom pendukung:
- `entityType`: Enum yang menentukan tabel induk (misalnya `"order"`, `"testing"`, `"user"`).
- `entityId`: UUID yang merujuk pada tabel induk tersebut.

Contoh di tabel `documents`:

```typescript
export const documents = createTable("documents", {
  // ...
  entityType: documentEntityTypeEnum("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  // ...
});
```

### Relasi di Drizzle:
Anda harus mendefinisikan relasi secara eksplisit di file `relations.ts` untuk setiap entitas yang didukung.

```typescript
export const documentsRelations = relations(documents, ({ one }) => ({
  order: one(order, {
    fields: [documents.entityId],
    references: [order.id],
    relationName: "orderDocuments",
  }),
  // ... tambahkan untuk entitas lain
}));
```

### Query Polimorfik
Anda dapat menggunakan utilitas `whereEntityIs` untuk mempermudah pencarian.

```typescript
import { db, whereEntityIs, isDocumentOfType } from "@tepian-k3/db";

// Query documents
const docs = await db.query.documents.findMany({
  where: whereEntityIs("order", orderId),
});

// Type-safe access
if (isDocumentOfType(document, "order")) {
  console.log(document.order?.orderNumber);
}
```

---

## 5. File Upload Pattern

Proses upload file wajib melalui service storage dari paket `@tepian-k3/services`. Jangan pernah menyimpan file binary langsung ke database.

```typescript
// Di tRPC router (gunakan formDataProcedure untuk memparsing input multipart)
upload: protectedProcedure
  .use(formDataProcedure(uploadSchema))
  .mutation(async ({ ctx, input }) =>
    await runEffect(
      Effect.gen(function* () {
        const arrayBuffer = yield* Effect.tryPromise(() =>
          input.data.file.arrayBuffer()
        );
        const buffer = Buffer.from(arrayBuffer);
        const filename = `uploads/${Date.now()}-${input.data.file.name}`;
        
        // Upload menggunakan storageService
        const uploaded = yield* storageService.upload(
          buffer,
          filename,
          input.data.file.type
        );
        
        // Kembalikan URL yang telah di-upload
        return { url: uploaded.url, filename };
      })
    )
  ),
```
