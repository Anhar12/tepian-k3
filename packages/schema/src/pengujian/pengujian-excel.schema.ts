import { z } from "zod";
import { EXCEL_LIMITS } from "@tepian-k3/constants";

// Normalisasi enum: "BAIK", "Baik", " baik " → semua diterima sebagai huruf kecil dan tanpa spasi di awal/akhir
const normalizeEnum = (v: unknown) =>
  typeof v === "string" ? v.toLowerCase().trim() : v;

// Normalisasi yes/no untuk tipe boolean
const normalizeBooleanEnum = (v: unknown) =>
  typeof v === "string" ? v.toLowerCase().trim() : v;

// Normalisasi field yang kosong di exceljs biasanya bisa berupa undefined atau empty string
const emptyStringToUndefined = (v: unknown) => (v === "" ? undefined : v);

export const excelParameterCategoryRowSchema = z.object({
  nama: z.string().min(1, "Nama kategori tidak boleh kosong"),
  cluster: z.string().min(1, "Cluster tidak boleh kosong"),
  deskripsi: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

export type ExcelParameterCategoryRow = z.infer<
  typeof excelParameterCategoryRowSchema
>;

export const excelParameterRowSchema = z.object({
  nama: z.string().min(1, "Nama parameter tidak boleh kosong"),
  kategori: z.string().min(1, "Kategori tidak boleh kosong"),
  referensi: z.preprocess(emptyStringToUndefined, z.string().optional()),
  harga: z.coerce.number().int().min(0, "Harga tidak boleh negatif"),
  satuan: z.string().min(1, "Satuan tidak boleh kosong"),
});

export type ExcelParameterRow = z.infer<typeof excelParameterRowSchema>;

export const excelToolCodeRowSchema = z.object({
  kode: z.string().min(1, "Kode alat tidak boleh kosong"),
  deskripsi: z.preprocess(emptyStringToUndefined, z.string().optional()),
  aktif: z.preprocess(
    normalizeBooleanEnum,
    z
      .enum(["ya", "tidak"], {
        message: "Nilai tidak valid. Gunakan 'ya' atau 'tidak'",
      })
      .default("ya"),
  ),
});

export type ExcelToolCodeRow = z.infer<typeof excelToolCodeRowSchema>;

export const excelToolRowSchema = z.object({
  kodeAlat: z.string().min(1, "Kode alat (tipe) tidak boleh kosong"),
  kodeFisik: z.string().min(1, "Kode fisik alat tidak boleh kosong"),
  namaAlat: z.string().min(1, "Nama alat tidak boleh kosong"),
  merek: z.preprocess(emptyStringToUndefined, z.string().optional()),
  tipe: z.preprocess(emptyStringToUndefined, z.string().optional()),
  nomorSeri: z.preprocess(emptyStringToUndefined, z.string().optional()),
  fungsi: z.preprocess(emptyStringToUndefined, z.string().optional()),
  lokasi: z.preprocess(emptyStringToUndefined, z.string().optional()),
  rak: z.preprocess(emptyStringToUndefined, z.string().optional()),
  nomorBMN: z.preprocess(emptyStringToUndefined, z.string().optional()),
  nomorNUP: z.preprocess(emptyStringToUndefined, z.string().optional()),
  tahunPerolehan: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().optional(),
  ),
  kondisi: z.preprocess(
    normalizeEnum,
    z
      .enum(["baik", "rusak", "diperingatkan", "tidak_menyala"], {
        message:
          "Kondisi tidak valid. Gunakan: baik, rusak, diperingatkan, atau tidak_menyala",
      })
      .default("baik"),
  ),
  ketersediaan: z.preprocess(
    normalizeEnum,
    z
      .enum(["ready", "kalibrasi", "not_ready", "maintenance", "dipinjam"], {
        message:
          "Ketersediaan tidak valid. Gunakan: ready, kalibrasi, not_ready, maintenance, atau dipinjam",
      })
      .default("ready"),
  ),
});

export type ExcelToolRow = z.infer<typeof excelToolRowSchema>;

export const excelChemicalMaterialRowSchema = z.object({
  kode: z.string().min(1, "Kode bahan tidak boleh kosong"),
  nomorKatalog: z.preprocess(emptyStringToUndefined, z.string().optional()),
  rumusKimia: z.preprocess(emptyStringToUndefined, z.string().optional()),
  nama: z.string().min(1, "Nama bahan tidak boleh kosong"),
  stokTerpakai: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().optional(),
  ),
  unitStokTerpakai: z.preprocess(
    emptyStringToUndefined,
    z.preprocess(
      normalizeEnum,
      z
        .enum(["gram", "kg", "botol", "ml", "liter"], {
          message:
            "Unit stok terpakai tidak valid. Gunakan: gram, kg, botol, ml, atau liter",
        })
        .optional(),
    ),
  ),
  stokTersegel: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().optional(),
  ),
  unitStokTersegel: z.preprocess(
    emptyStringToUndefined,
    z.preprocess(
      normalizeEnum,
      z
        .enum(["gram", "kg", "botol", "ml", "liter"], {
          message:
            "Unit stok tersegel tidak valid. Gunakan: gram, kg, botol, ml, atau liter",
        })
        .optional(),
    ),
  ),
  penggunaanBulanan: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().optional(),
  ),
  unitPenggunaan: z.preprocess(
    emptyStringToUndefined,
    z.preprocess(
      normalizeEnum,
      z
        .enum(["gram", "kg", "botol", "ml", "liter"], {
          message:
            "Unit penggunaan tidak valid. Gunakan: gram, kg, botol, ml, atau liter",
        })
        .optional(),
    ),
  ),
  status: z.preprocess(
    normalizeEnum,
    z
      .enum(["tersedia", "hampir_habis", "habis", "expired", "dipesan"], {
        message:
          "Status tidak valid. Gunakan: tersedia, hampir_habis, habis, expired, atau dipesan",
      })
      .default("tersedia"),
  ),
  tanggalKadaluarsa: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  catatanMasuk: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

export type ExcelChemicalMaterialRow = z.infer<
  typeof excelChemicalMaterialRowSchema
>;

// Schema untuk upload form (tRPC endpoint)
// Note: instanceOf(File) hanya bekerja di environment tertentu.
// Untuk support Hono/tRPC middleware file uplaod, kita asumsikan validasi `File` dari standard DOM File / web-standard File
export const importExcelFormSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, "Input harus berupa File")
    .refine((f) => f.name.endsWith(".xlsx"), "Hanya file .xlsx yang diterima")
    .refine(
      (f) => f.size <= EXCEL_LIMITS.MAX_FILE_SIZE_BYTES,
      `Ukuran file tidak boleh lebih dari ${EXCEL_LIMITS.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
    ),
});
