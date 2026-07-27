# Buku Panduan Debugging & Perbaikan Bug (Troubleshooting Playbook)

Panduan ini membantu mendiagnosis dan memperbaiki bug backend yang umum terjadi pada proyek tepian-k3.

## A. Mengatasi Error Type Check (`pnpm check-types`)

Error tipe TypeScript biasanya terjadi ketika ada ketidaksesuaian antara skema basis data, skema Zod, dan model UI.

- **Langkah Penyelarasan**:
  1. Pastikan perubahan skema di `packages/db/src/schema/` sudah di-generate ke file TS/SQL menggunakan `pnpm db:generate`.
  2. Periksa skema Zod di `packages/schema/src/` apakah sudah diekstensi dari drizzle-zod menggunakan `createInsertSchema` atau `createSelectSchema`.
  3. Gunakan perintah `pnpm check-types` untuk melacak error secara detail.
- **Aturan AI Agent**: Batasi maksimal **2 kali** perbaikan tipe secara mandiri. Jika masih gagal, presentasikan pesan error dan alternatif struktur data kepada pengembang untuk didiskusikan.

## B. Error API & Jaringan tRPC

### 1. Error 403 Forbidden (Akses Ditolak)

Error ini terjadi saat peran (role) atau izin (permission) pengguna saat ini tidak memenuhi syarat untuk mengeksekusi aksi/rute terkait.

- **JWT Stateless Caching**: Roles dan permissions pengguna di-cache secara stateless di dalam JWT access token saat proses autentikasi (login).
- **Solusi**:
  > [!IMPORTANT]
  > Jika peran/izin baru saja diubah di basis data (PostgreSQL), pengguna **WAJIB melakukan logout dan login ulang** agar token JWT diperbarui dengan data izin terbaru dari basis data.
- **Pengecekan Kode**:
  1. Periksa middleware router di backend: pastikan endpoint dilindungi dengan `.use(withPermission("nama.permission"))`.
  2. Periksa rute guard frontend di `apps/web/src/routes/`: pastikan fungsi `beforeLoad` memanggil `requirePermission(context, { permission: "nama.permission" })`.

### 2. Error 404 Halaman Tidak Ditemukan / Data Tidak Ditemukan

Error ini terjadi saat alamat rute tidak cocok atau data yang diminta telah dihapus.

- **Soft Delete Filter**: Semua tabel menggunakan spread `...timestamps` yang mencakup field `deletedAt` (untuk soft delete).
- **Solusi**:
  - Periksa query Drizzle di `packages/queries/src/`. Pastikan klausa `where` menyertakan pengecekan:
    ```typescript
    and(eq(table.id, id), isNull(table.deletedAt));
    ```
  - Jika bernilai non-null, data dianggap terhapus dan endpoint query akan mengembalikan `NOT_FOUND`.

### 3. Error 500 Internal Server Error

Terjadi ketika ada unhandled exception di sisi backend (Hono).

- **Solusi**:
  - Periksa console output dev-server di port `:3000` (atau gunakan log manager) untuk melihat stack trace asli.
  - Masalah umum: Field JSONB dibaca sebagai string kosong atau struktur schema Zod input tidak cocok dengan parameter query Drizzle.

## C. Masalah Skema & Migrasi Database

Saat memodifikasi struktur database, pastikan urutan migrasi tidak merusak data dev.

- **Dev Push**: Gunakan `pnpm db:push` untuk menyinkronkan skema database lokal secara cepat tanpa membuat file migrasi baru (hanya di lingkungan development).
- **Production Build**: Gunakan `pnpm db:generate` diikuti dengan `pnpm db:migrate` untuk mencatat migrasi di production.
- **Conflict Recovery**: Jika file migrasi bentrok di repositori git, jalankan `pnpm db:reset` untuk mereset database lokal dan menerapkan ulang seluruh file migrasi dari awal.

## D. Jebakan & Gotchas Umum (Common Pitfalls Checklist)

Tolong perhatikan daftar jebakan runtime dan kompilasi ini sebelum menulis kode:

1. **Impor Modul CommonJS di ESM (Studi Kasus: ExcelJS)**
   - **Masalah**: Menulis `import * as exceljs from "exceljs"` akan menyebabkan runtime crash `TypeError: exceljs.Workbook is not a constructor`. Hal ini terjadi karena bundler memetakan default export modul CommonJS ke dalam properti `.default`.
   - **Solusi**: Selalu gunakan default import:
     ```typescript
     import exceljs from "exceljs";
     ```

2. **Filter Soft Delete (`deletedAt`)**
   - **Masalah**: Data yang sudah dihapus oleh pengguna masih muncul di query.
   - **Solusi**: Semua query pembacaan data harus menyertakan kondisi `isNull(tableName.deletedAt)` di dalam klausa `where`.

3. **Gunakan UUIDv7 untuk Primary Key Baru**
   - **Masalah**: Bentrok urutan data atau performa indeks menurun jika menggunakan format UUID lama.
   - **Solusi**: Pastikan kolom `id` dideklarasikan dengan fungsi generator `uuidv7()`:
     ```typescript
     id: uuid("id")
       .primaryKey()
       .notNull()
       .$default(() => uuidv7());
     ```

4. **Unique Index Constraint dengan Kondisi Soft Delete**
   - **Masalah**: Gagal memasukkan data baru dengan nama yang sama, padahal data sebelumnya sudah di-soft-delete.
   - **Solusi**: Indeks unik di Drizzle ORM harus mengabaikan baris yang di-soft-delete menggunakan `.where(sql`${table.deletedAt} IS NULL`)`:
     ```typescript
     uniqueIndex("name_idx")
       .on(table.name)
       .where(sql`${table.deletedAt} IS NULL`);
     ```
