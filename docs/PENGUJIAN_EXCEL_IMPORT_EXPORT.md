# Pengujian Master Data Excel Import & Export - Technical Guide

Dokumen ini adalah panduan teknis lengkap yang menjelaskan arsitektur fitur Impor & Ekspor data master pengujian menggunakan berkas spreadsheet (.xlsx). Dokumentasi ini dirancang agar mudah dipahami oleh pengembang junior maupun model kecerdasan buatan (AI) yang lebih hemat biaya guna memperluas atau memelihara fitur ini di kemudian hari.

---

## 1. Ikhtisar Arsitektur (Architecture Overview)

Fitur impor/ekspor data master pengujian dirancang mengikuti pola **modular monolith** yang terbagi ke dalam 5 bagian terpisah untuk pemisahan tanggung jawab (_separation of concerns_) yang bersih:

```
┌────────────────────────────────────────────────────────┐
│                        tRPC API                        │
│   (packages/api/src/routers/pengujian/pengujian-excel.ts)│
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                      Excel Service                     │
│    (packages/services/src/excel/pengujian-excel.*)     │
│    ├─ Parser (Validasi Zod per baris & Kumpul Error)    │
│    └─ Builder (Bangun Template & Laporan Error)         │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Queries & DB Layer                  │
│(packages/queries/src/pengujian/pengujian-excel.queries.ts)│
│    └─ Import via Single Transaction & Audit Logs       │
└────────────────────────────────────────────────────────┘
```

Secara umum, alur impor data adalah sebagai berikut:

1. Pengguna mengunggah berkas Excel (`.xlsx`) via tRPC `formDataProcedure`.
2. **Excel Service Parser** mengonversi buffer Excel menjadi data mentah, mencocokkannya dengan **Zod Schema**, serta menyaring jika ada baris yang melanggar aturan tanpa membatalkan proses pembacaan baris berikutnya (_non-blocking error collection_).
3. Jika terdapat _error_, **Excel Service Builder** otomatis membuat berkas laporan kesalahan baru berisi rangkuman statistik dan baris-baris bermasalah untuk diunduh pengguna.
4. Jika tidak ada _error_, data dikirim ke **Queries Layer** untuk dimasukkan ke database dalam **satu transaksi tunggal** (jika salah satu gagal, seluruh transaksi di-_rollback_) dan mencatat riwayat ke tabel audit (`audits`).

---

## 2. Struktur Komponen Kode

### A. Kolom & Metadata (`packages/constants/src/pengujian-excel.constants.ts`)

Seluruh definisi kolom untuk 5 sheet (`KategoriParameter`, `Parameter`, `KodeAlat`, `Alat`, dan `BahanKimia`) dipusatkan pada objek `EXCEL_SHEETS`. Hal ini menjamin konsistensi label header, lebar kolom, pilihan validasi dropdown, dan data contoh antara **Parser** dan **Builder**.

- **Pola Kode:**
  ```typescript
  export interface ColumnDefinition {
    header: string; // Label kolom di baris 1 (misal: "Nama Parameter*")
    key: string; // Properti data di JS object (misal: "nama")
    width: number; // Lebar kolom di Excel
    required?: boolean;
    default?: string;
    validation?: { type: "list"; values: readonly string[] }; // Dropdown list excel
    exampleValue?: string | number;
  }
  ```

### B. Validasi Baris (`packages/schema/src/pengujian/pengujian-excel.schema.ts`)

Zod digunakan untuk memvalidasi struktur data per baris. Terdapat preprocess tambahan untuk menormalkan data input dari Excel:

1.  **Normalisasi Teks & Enum:** Mengubah ke huruf kecil dan menghapus spasi (`v.toLowerCase().trim()`).
2.  **Konversi Nilai Kosong:** Mengubah string kosong `""` menjadi `undefined`.
3.  **Boolean Coercion:** Mengubah string `"ya"` / `"tidak"` menjadi nilai boolean.

- **Pola Skema Baris:**
  ```typescript
  export const excelToolCodeRowSchema = z.object({
    kode: z.string().min(1, "Kode alat tidak boleh kosong"),
    deskripsi: z.preprocess(emptyStringToUndefined, z.string().optional()),
    aktif: z.preprocess(
      normalizeBooleanEnum,
      z.enum(["ya", "tidak"]).default("ya"),
    ),
  });
  ```

### C. Parser (`packages/services/src/excel/pengujian-excel.parser.ts`)

Parser membaca buffer biner berkas Excel menggunakan pustaka `exceljs` dan memproses baris demi baris menggunakan skema Zod di atas.

> [!IMPORTANT]
> **Peringatan Impor ESM pada CommonJS:** Jangan gunakan `import * as exceljs` karena dapat memicu galat runtime `Workbook is not a constructor`. Selalu gunakan _default import_:
> `import exceljs from "exceljs";`

- **Pola Implementasi Pembacaan Sheet:**

  ```typescript
  function parseSheet<T>(
    worksheet: exceljs.Worksheet,
    columns: ColumnDefinition[],
    schema: z.ZodSchema<T>,
    successRows: ValidRow<T>[],
    errors: ParseError[],
  ) {
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Lewati header

      // Ekstrak data berdasarkan konfigurasi key kolom
      const rawRow: Record<string, any> = {};
      columns.forEach((col, index) => {
        const cellValue = row.getCell(index + 1).value;
        rawRow[col.key] = parseCellValue(cellValue);
      });

      // Validasi dengan Zod
      const parsed = schema.safeParse(rawRow);
      if (parsed.success) {
        successRows.push({ rowNumber, data: parsed.data });
      } else {
        // Kumpulkan error tanpa menghentikan iterasi baris lain
        parsed.error.errors.forEach((err) => {
          errors.push({
            sheet: worksheet.name,
            row: rowNumber,
            field: err.path.join("."),
            message: err.message,
          });
        });
      }
    });
  }
  ```

### D. Builder (`packages/services/src/excel/pengujian-excel.builder.ts`)

Pustaka `exceljs` digunakan untuk merancang struktur dokumen. Beberapa gaya visual premium diterapkan secara dinamis:

1.  **Header Styling:** Warna kuning (#FFEB3B) untuk kolom wajib (_required_) dan abu-abu terang (#E0E0E0) untuk kolom opsional. Teks dicetak tebal dengan penjajaran tengah.
2.  **Data Validation Dropdown:** Seluruh baris di bawah kolom yang memiliki opsi bertipe enum (seperti kolom `"aktif"` dengan opsi `ya, tidak`) otomatis dipasangi pembatasan validasi dropdown bawaan Excel.
3.  **Instruction Sheet:** Dilengkapi lembar panduan `"📖 Petunjuk"` berisikan tata cara pengisian, aturan tipe data, dan petunjuk relasi.

### E. Queries Layer (`packages/queries/src/pengujian/pengujian-excel.queries.ts`)

Menangani penyimpanan data hasil parsing Excel ke database. Semua operasi insert dibungkus dalam **transaksi** database Drizzle (`db.transaction`).

- **Logika Urutan Relasi Data (Dependency Order):**
  Saat impor dijalankan, urutan eksekusi query _insert_ harus mengikuti hierarki relasi data agar tidak melanggar _foreign key constraints_:
  1.  `parameterCategories` dimasukkan pertama kali (dan mencocokkan relasi `clusterId` dari nama klaster).
  2.  `parameters` dimasukkan berikutnya (mencocokkan `categoryId` dari nama kategori).
  3.  `toolCodes` dimasukkan.
  4.  `tools` dimasukkan (mencocokkan `toolCodeId` dari kode alat).
  5.  `chemicalMaterials` dimasukkan terakhir.
- **Pola Query Transaksional:**

  ```typescript
  export const pengujianExcelQueries = {
    importFromParsedData(parsedData: ParseResult, userId: string, userEmail: string) {
      return Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // 1. Impor Kategori Parameter
            for (const row of parsedData.parameterCategories) {
              const cluster = await tx.query.clusters.findFirst({
                where: eq(clusters.name, row.data.cluster),
              });
              if (!cluster) throw new Error(`Cluster '${row.data.cluster}' tidak ditemukan di sistem.`);

              await tx.insert(parameterCategories)
                .values({ name: row.data.nama, clusterId: cluster.id, description: row.data.deskripsi })
                .onConflictDoUpdate({
                  target: parameterCategories.name,
                  set: { description: row.data.deskripsi, updatedAt: sql`CURRENT_TIMESTAMP` }
                });
            }

            // 2. Lanjutkan impor parameter, kode alat, alat, dst...

            // 3. Catat entri log audit untuk melacak aksi impor
            await auditQueries.createAudit({ ... });
          }),
        catch: (error) => error as TRPCError
      });
    }
  }
  ```

### F. tRPC Router (`packages/api/src/routers/pengujian/pengujian-excel.ts`)

Menggunakan skema `importExcelFormSchema` dengan properti kustom untuk memvalidasi lampiran bertipe biner (`instanceof File`), membatasi ukuran maksimal, serta menerapkan rate-limiter di tingkat endpoint demi mencegah pembebanan server secara berlebihan.

---

## 3. Panduan Pengembangan / Replikasi Fitur (Extensibility Blueprint)

Jika Anda ingin mereplikasi arsitektur ini untuk mengekspor/mengimpor modul lain (contoh: **Pelatihan K3 / LMS**), ikuti langkah-langkah terstruktur berikut:

### Langkah 1: Tentukan Metadata Kolom

Tambahkan definisi sheet dan kolom baru di berkas constants (misal: `packages/constants/src/pelatihan-excel.constants.ts`):

```typescript
export const EXCEL_SHEETS = {
  pelatihan: {
    sheetName: "KatalogPelatihan",
    columns: [
      { header: "Judul Pelatihan*", key: "judul", width: 30, required: true },
      {
        header: "Tingkatan*",
        key: "level",
        width: 15,
        required: true,
        validation: {
          type: "list",
          values: ["beginner", "intermediate", "advanced"],
        },
      },
      { header: "Durasi (Jam)*", key: "durasi", width: 15, required: true },
      { header: "Harga*", key: "harga", width: 15, required: true },
    ],
  },
};
```

### Langkah 2: Buat Skema Zod Per Baris

Buat validator data mentah per baris di berkas skema (misal: `packages/schema/src/pelatihan/pelatihan-excel.schema.ts`):

```typescript
export const excelPelatihanRowSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  durasi: z.coerce.number().int().min(1, "Durasi minimal 1 jam"),
  harga: z.coerce.number().int().min(0, "Harga tidak boleh negatif"),
});
```

### Langkah 3: Susun Fungsi Parser & Builder

Terapkan logika parsing dan pembentukan Excel menggunakan template boilerplate yang sama di service:

```typescript
// Gunakan template parseSheet yang memetakan kolom ke excelPelatihanRowSchema
```

### Langkah 4: Terapkan Transaksi di Layer Queries

Buat berkas query transaksional baru:

- Membaca data ter-parse.
- Membungkus proses insert di dalam `db.transaction`.
- Menerapkan strategi `onConflictDoUpdate` jika data sudah ada agar tidak memicu duplikasi data primer.

### Langkah 5: Daftarkan Route ke Router tRPC

Buat endpoint baru pada router tRPC domain tujuan dengan konfigurasi `formDataProcedure` untuk menangani kiriman file biner multipart.

---

## 4. Tips Pemeliharaan & Debugging

1.  **Validasi Baris Kosong:** Excel terkadang menyertakan baris kosong tersembunyi yang memiliki _style_ (dianggap memiliki data). Parser menyiasatinya dengan mengabaikan baris jika semua nilai selnya bernilai kosong/null.
2.  **Menangani File Laporan Error:** Ketika proses validasi Zod mendeteksi kegagalan, API tidak melempar pengecualian fatal (exception error), melainkan mengembalikan properti `{ success: false, hasErrors: true, errorReportBase64: "..." }`. Sisi frontend React harus menangkap kembalian ini, mengubah format base64 menjadi biner blob, lalu menyajikan tombol unduh berkas laporan kegagalan bagi pengguna.
3.  **Dropdown Opsi Panjang:** Excel membatasi panjang opsi teks di dalam formula dropdown maksimal 255 karakter. Jika opsi enum Anda sangat panjang, disarankan untuk merujuk isi sel ke area tersembunyi (_hidden sheet range_) alih-alih menuliskannya secara mentah di formula list.
