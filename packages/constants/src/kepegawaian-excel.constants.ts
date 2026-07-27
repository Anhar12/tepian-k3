import type { SheetDefinition } from "./pengujian-excel.constants";

export const KEPEGAWAIAN_EXCEL_SHEETS = {
  jabatan: {
    sheetName: "Jabatan",
    columns: [
      {
        header: "Nama Jabatan*",
        key: "nama",
        width: 30,
        required: true,
        exampleValue: "Petugas Sampling",
      },
      {
        header: "Deskripsi",
        key: "deskripsi",
        width: 45,
        exampleValue: "Deskripsi tugas jabatan",
      },
    ],
  },
  pegawai: {
    sheetName: "Pegawai",
    columns: [
      {
        header: "NIP*",
        key: "nip",
        width: 25,
        required: true,
        exampleValue: "198501012010011001",
      },
      { header: "Nama Lengkap*", key: "nama", width: 35, required: true },
      { header: "Email*", key: "email", width: 35, required: true },
      {
        header: "Tipe*",
        key: "tipe",
        width: 20,
        required: true,
        validation: { type: "list", values: ["PNS", "PPPK", "Honorer"] },
      },
      {
        header: "Jabatan*",
        key: "jabatan",
        width: 30,
        required: true,
        exampleValue: "Petugas Sampling",
      },
      {
        header: "Status*",
        key: "status",
        width: 20,
        required: true,
        validation: { type: "list", values: ["siap", "bertugas", "cuti"] },
      },
    ],
  },
  sertifikasiPegawai: {
    sheetName: "SertifikasiPegawai",
    columns: [
      { header: "NIP Pegawai*", key: "nipPegawai", width: 25, required: true },
      {
        header: "Nama Sertifikasi*",
        key: "namaSertifikasi",
        width: 40,
        required: true,
      },
      {
        header: "Diterbitkan Oleh*",
        key: "diterbitkanOleh",
        width: 30,
        required: true,
      },
      {
        header: "Tanggal Terbit* (YYYY-MM-DD)",
        key: "tanggalTerbit",
        width: 25,
        required: true,
      },
      {
        header: "Tanggal Kadaluarsa (YYYY-MM-DD)",
        key: "tanggalKadaluarsa",
        width: 25,
      },
    ],
  },
} satisfies Record<string, SheetDefinition>;
