# Helpers untuk Pengujian (Tests)

Folder ini berisi fungsi-fungsi pembantu (helpers) yang digunakan di seluruh test suite untuk memastikan pengujian berjalan secara optimal, terisolasi, dan mudah di-maintain.

## File Utama

### 1. `test-db.ts`
Menyediakan instance dari PGlite (database in-memory yang kompatibel dengan PostgreSQL) untuk pengujian.
- **`createIsolatedTestDb()`**: Membuat instance PGlite baru dari awal, menjalankan semua migrasi Drizzle, dan mematikan foreign key checks agar testing lebih mudah. Berguna jika tes membutuhkan isolasi total.
- **`getSharedTestDb()`**: (Singleton) Menggunakan ulang instance database yang sama antar tes. Ini adalah pola yang disarankan (best practice) untuk menghemat waktu eksekusi tes dan mencegah timeout. Digabungkan dengan mode sekuensial (sequential) di Vitest.
- **`truncateAllTables()`**: Mengosongkan semua tabel (kecuali tabel migrasi) sebelum tiap pengujian. Wajib dipanggil di dalam `beforeEach()` untuk menjaga state deterministik.

### 2. `fixtures.ts`
Berisi _factory functions_ untuk membuat data dummy (mock data) yang konsisten dan memenuhi semua _database constraints_ (NOT NULL, foreign keys, dll.).
- **`createMockUserAndCompany()`**: Membuat entitas user dan company yang saling berelasi.
- **`createMockCluster()`**: Membuat kluster dan kategori parameter.
- **`createMockParameter()`**: Membuat parameter yang sudah terhubung dengan kategori dan kluster secara otomatis.
- **`createMockTool()`**: Membuat alat (tool).
- **`createMockOrderAndWorksheet()`**: Membuat skenario kompleks end-to-end yang melibatkan Order, Worksheet, dan data relasional lainnya.

## Best Practices (Panduan untuk Developer & AI Agent)

1. **Selalu gunakan `getSharedTestDb()`**: Jangan memanggil `createIsolatedTestDb()` di setiap tes karena inisialisasi PGlite + migrasi memakan waktu yang lama dan bisa menyebabkan error timeout.
2. **Bersihkan state dengan `truncateAllTables()`**: Panggil fungsi ini di dalam blok `beforeEach()` untuk memastikan tes sebelumnya tidak mengotori database.
3. **Gunakan Fixtures yang ada**: Jangan membuat insert manual ke database menggunakan Drizzle di dalam tes jika fixture sudah tersedia. Fixture otomatis meng-_handle_ field wajib (seperti ID dengan `uuidv7()`, relasi foreign key berjenjang, dan nilai enum default).
4. **Relasi Otomatis (Auto-wiring)**: Jika sebuah fixture membutuhkan relasi (misalnya `createMockParameter` butuh `categoryId`), fixture akan secara cerdas memanggil fixture parent-nya (`createMockCluster`) jika argumen tidak diberikan. Ini mencegah error _foreign key constraint violation_.
