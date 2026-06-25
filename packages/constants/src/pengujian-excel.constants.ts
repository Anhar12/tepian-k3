/**
 * Definisi struktur kolom untuk setiap sheet Excel master data pengujian.
 *
 * Setiap entri kolom mendefinisikan:
 * - header: Label kolom yang ditampilkan di baris pertama Excel
 * - key: Nama field di dalam row object (dipakai parser & builder)
 * - width: Lebar kolom dalam karakter
 * - required: Apakah kolom wajib diisi (ditandai * di header)
 * - default: Nilai default jika kolom dikosongkan (hanya untuk enum)
 * - validation: Dropdown list validation untuk kolom enum
 * - exampleValue: Nilai contoh yang ditampilkan di baris contoh template
 */

export interface ColumnDefinition {
  header: string;
  key: string;
  width: number;
  required?: boolean;
  default?: string;
  validation?: { type: "list"; values: readonly string[] };
  exampleValue?: string | number;
}

export interface SheetDefinition {
  sheetName: string;
  columns: ColumnDefinition[];
}

export const SHEET_NAMES = {
  parameterCategories: "KategoriParameter",
  parameters: "Parameter",
  toolCodes: "KodeAlat",
  tools: "Alat",
  chemicalMaterials: "BahanKimia",
} as const satisfies Record<string, string>;

export const EXCEL_SHEETS = {
  parameterCategories: {
    sheetName: SHEET_NAMES.parameterCategories,
    columns: [
      {
        header: "Nama Kategori*",
        key: "nama",
        width: 30,
        required: true,
        exampleValue: "Fisika",
      },
      {
        header: "Cluster*",
        key: "cluster",
        width: 20,
        required: true,
        exampleValue: "K3 Lingkungan",
      },
      {
        header: "Deskripsi",
        key: "deskripsi",
        width: 50,
        exampleValue: "Parameter pengujian fisika",
      },
    ],
  },

  parameters: {
    sheetName: SHEET_NAMES.parameters,
    columns: [
      {
        header: "Nama Parameter*",
        key: "nama",
        width: 35,
        required: true,
        exampleValue: "Kebisingan",
      },
      {
        header: "Kategori*",
        key: "kategori",
        width: 25,
        required: true,
        exampleValue: "Fisika",
      },
      {
        header: "Referensi",
        key: "referensi",
        width: 30,
        exampleValue: "SNI 7231:2009",
      },
      {
        header: "Harga (Rp)*",
        key: "harga",
        width: 15,
        required: true,
        exampleValue: 150000,
      },
      {
        header: "Satuan*",
        key: "satuan",
        width: 15,
        required: true,
        exampleValue: "titik",
      },
    ],
  },

  toolCodes: {
    sheetName: SHEET_NAMES.toolCodes,
    columns: [
      {
        header: "Kode*",
        key: "kode",
        width: 20,
        required: true,
        exampleValue: "SLM",
      },
      {
        header: "Deskripsi",
        key: "deskripsi",
        width: 50,
        exampleValue: "Sound Level Meter",
      },
      {
        header: "Aktif*",
        key: "aktif",
        width: 10,
        required: true,
        default: "ya",
        validation: { type: "list", values: ["ya", "tidak"] },
        exampleValue: "ya",
      },
    ],
  },

  tools: {
    sheetName: SHEET_NAMES.tools,
    columns: [
      {
        header: "Kode Alat (Tipe)*",
        key: "kodeAlat",
        width: 20,
        required: true,
        exampleValue: "SLM",
      },
      {
        header: "Kode Fisik Alat*",
        key: "kodeFisik",
        width: 20,
        required: true,
        exampleValue: "SLM-001",
      },
      {
        header: "Nama Alat*",
        key: "namaAlat",
        width: 30,
        required: true,
        exampleValue: "Sound Level Meter LUTRON",
      },
      { header: "Merek", key: "merek", width: 20, exampleValue: "LUTRON" },
      { header: "Tipe", key: "tipe", width: 20, exampleValue: "SL-4013" },
      {
        header: "Nomor Seri",
        key: "nomorSeri",
        width: 25,
        exampleValue: "A123456",
      },
      {
        header: "Fungsi",
        key: "fungsi",
        width: 40,
        exampleValue: "Mengukur kebisingan",
      },
      {
        header: "Lokasi",
        key: "lokasi",
        width: 30,
        exampleValue: "Ruang Penyimpanan A",
      },
      { header: "Rak", key: "rak", width: 15, exampleValue: "Rak-3" },
      { header: "Nomor BMN", key: "nomorBMN", width: 20 },
      { header: "Nomor NUP", key: "nomorNUP", width: 20 },
      {
        header: "Tahun Perolehan",
        key: "tahunPerolehan",
        width: 18,
        exampleValue: 2022,
      },
      {
        header: "Kondisi*",
        key: "kondisi",
        width: 20,
        required: true,
        default: "baik",
        validation: {
          type: "list",
          values: ["baik", "rusak", "diperingatkan", "tidak_menyala"],
        },
        exampleValue: "baik",
      },
      {
        header: "Ketersediaan*",
        key: "ketersediaan",
        width: 18,
        required: true,
        default: "ready",
        validation: {
          type: "list",
          values: [
            "ready",
            "kalibrasi",
            "not_ready",
            "maintenance",
            "dipinjam",
          ],
        },
        exampleValue: "ready",
      },
    ],
  },

  chemicalMaterials: {
    sheetName: SHEET_NAMES.chemicalMaterials,
    columns: [
      {
        header: "Kode Bahan*",
        key: "kode",
        width: 20,
        required: true,
        exampleValue: "HCL-001",
      },
      {
        header: "Nomor Katalog",
        key: "nomorKatalog",
        width: 20,
        exampleValue: "1.09057",
      },
      {
        header: "Rumus Kimia",
        key: "rumusKimia",
        width: 15,
        exampleValue: "HCl",
      },
      {
        header: "Nama Bahan*",
        key: "nama",
        width: 35,
        required: true,
        exampleValue: "Asam Klorida",
      },
      {
        header: "Stok Terpakai",
        key: "stokTerpakai",
        width: 15,
        exampleValue: 250,
      },
      {
        header: "Unit Stok Terpakai",
        key: "unitStokTerpakai",
        width: 18,
        validation: {
          type: "list",
          values: ["gram", "kg", "botol", "ml", "liter"],
        },
        exampleValue: "ml",
      },
      {
        header: "Stok Tersegel",
        key: "stokTersegel",
        width: 15,
        exampleValue: 2,
      },
      {
        header: "Unit Stok Tersegel",
        key: "unitStokTersegel",
        width: 18,
        validation: {
          type: "list",
          values: ["gram", "kg", "botol", "ml", "liter"],
        },
        exampleValue: "botol",
      },
      {
        header: "Penggunaan Bulanan",
        key: "penggunaanBulanan",
        width: 20,
        exampleValue: 100,
      },
      {
        header: "Unit Penggunaan",
        key: "unitPenggunaan",
        width: 15,
        validation: {
          type: "list",
          values: ["gram", "kg", "botol", "ml", "liter"],
        },
        exampleValue: "ml",
      },
      {
        header: "Status*",
        key: "status",
        width: 18,
        required: true,
        default: "tersedia",
        validation: {
          type: "list",
          values: ["tersedia", "hampir_habis", "habis", "expired", "dipesan"],
        },
        exampleValue: "tersedia",
      },
      {
        header: "Tanggal Kadaluarsa",
        key: "tanggalKadaluarsa",
        width: 20,
        exampleValue: "2027-12-31",
      },
      { header: "Catatan Masuk", key: "catatanMasuk", width: 40 },
    ],
  },
} as const satisfies Record<string, SheetDefinition>;

// Batas teknis
export const EXCEL_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_ROWS_PER_SHEET: 2000,
  IMPORT_RATE_LIMIT_SECONDS: 60,
} as const;

// Warna styling
export const EXCEL_STYLES = {
  HEADER_REQUIRED_BG: "2563EB", // biru — kolom wajib
  HEADER_OPTIONAL_BG: "3B82F6", // biru muda — kolom opsional
  HEADER_FONT_COLOR: "FFFFFF", // putih
  EXAMPLE_ROW_BG: "FEF9C3", // kuning muda — baris contoh
  ERROR_ROW_BG: "FEE2E2", // merah muda — baris error di laporan
  SUCCESS_ROW_BG: "DCFCE7", // hijau muda — baris sukses di laporan
} as const;
