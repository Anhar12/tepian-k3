import { z } from "zod";
import { EXCEL_LIMITS } from "@tepian-k3/constants";

// Normalisasi enum: "BAIK", "Baik", " baik " → semua diterima sebagai huruf kecil dan tanpa spasi di awal/akhir
const normalizeEnum = (v: unknown) =>
  typeof v === "string" ? v.toLowerCase().trim() : v;

// Normalisasi field yang kosong di exceljs biasanya bisa berupa undefined atau empty string
const emptyStringToUndefined = (v: unknown) => (v === "" ? undefined : v);

export const excelJabatanRowSchema = z.object({
  nama: z.string().min(1, "Nama jabatan tidak boleh kosong"),
  deskripsi: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

export type ExcelJabatanRow = z.infer<typeof excelJabatanRowSchema>;

export const excelPegawaiRowSchema = z.object({
  nip: z.string().min(1, "NIP tidak boleh kosong"),
  nama: z.string().min(1, "Nama lengkap tidak boleh kosong"),
  email: z.string().email("Format email tidak valid"),
  tipe: z.preprocess(
    normalizeEnum,
    z.enum(["pns", "pppk", "honorer"], {
      message: "Tipe tidak valid. Gunakan: pns, pppk, atau honorer",
    })
  ),
  jabatan: z.string().min(1, "Jabatan tidak boleh kosong"),
  status: z.preprocess(
    normalizeEnum,
    z
      .enum(["siap", "bertugas", "cuti"], {
        message: "Status tidak valid. Gunakan: siap, bertugas, atau cuti",
      })
      .default("siap")
  ),
});

export type ExcelPegawaiRow = z.infer<typeof excelPegawaiRowSchema>;

export const excelSertifikasiRowSchema = z.object({
  nipPegawai: z.string().min(1, "NIP pegawai tidak boleh kosong"),
  namaSertifikasi: z.string().min(1, "Nama sertifikasi tidak boleh kosong"),
  diterbitkanOleh: z.string().min(1, "Penerbit sertifikasi tidak boleh kosong"),
  tanggalTerbit: z.string().min(1, "Tanggal terbit tidak boleh kosong"), // format: YYYY-MM-DD
  tanggalKadaluarsa: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

export type ExcelSertifikasiRow = z.infer<typeof excelSertifikasiRowSchema>;

// Schema untuk upload form (tRPC endpoint)
export const importKepegawaianExcelFormSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, "Input harus berupa File")
    .refine((f) => f.name.endsWith(".xlsx"), "Hanya file .xlsx yang diterima")
    .refine(
      (f) => f.size <= EXCEL_LIMITS.MAX_FILE_SIZE_BYTES,
      `Ukuran file tidak boleh lebih dari ${EXCEL_LIMITS.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`
    ),
});
