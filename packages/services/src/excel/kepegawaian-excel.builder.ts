import exceljs from "exceljs";
import { EXCEL_STYLES } from "@tepian-k3/constants";
import { KEPEGAWAIAN_EXCEL_SHEETS } from "@tepian-k3/constants";
import type { SheetDefinition } from "@tepian-k3/constants";

export interface KepegawaianExportData {
  jabatan: Record<string, any>[];
  pegawai: Record<string, any>[];
  sertifikasi: Record<string, any>[];
}

export interface KepegawaianImportReportData {
  summary: Record<
    string,
    { processed: number; success: number; failed: number }
  >;
  errors: Array<{
    sheet: string;
    row: number;
    field?: string;
    message: string;
  }>;
}

function setupSheetHeaders(
  worksheet: exceljs.Worksheet,
  sheetDef: SheetDefinition,
) {
  worksheet.columns = sheetDef.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const colDef = sheetDef.columns[colNumber - 1];
    const bgColor = colDef?.required
      ? EXCEL_STYLES.HEADER_REQUIRED_BG
      : EXCEL_STYLES.HEADER_OPTIONAL_BG;

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: bgColor },
    };
    cell.font = {
      color: { argb: EXCEL_STYLES.HEADER_FONT_COLOR },
      bold: true,
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
}

function applyDataValidation(
  worksheet: exceljs.Worksheet,
  sheetDef: SheetDefinition,
  maxRows = 2000,
) {
  sheetDef.columns.forEach((colDef, colIndex) => {
    if (colDef.validation && colDef.validation.type === "list") {
      const colLetter = worksheet.getColumn(colIndex + 1).letter;
      for (let i = 2; i <= maxRows; i++) {
        worksheet.getCell(`${colLetter}${i}`).dataValidation = {
          type: "list",
          allowBlank: !colDef.required,
          formulae: [`"${colDef.validation.values.join(",")}"`],
        };
      }
    }
  });
}

function addInstructionSheet(workbook: exceljs.Workbook) {
  const ws = workbook.addWorksheet("📖 Petunjuk");
  ws.getColumn(1).width = 100;

  const instructions = [
    "Petunjuk Penggunaan File Excel Master Data Kepegawaian",
    "══════════════════════════════════════════════════════",
    "• File ini berisi 3 sheet: Jabatan, Pegawai, SertifikasiPegawai",
    "• Jangan ubah nama sheet atau urutan kolom",
    "• Kolom dengan tanda * wajib diisi",
    "• Kolom dengan dropdown → klik sel untuk melihat pilihan yang valid",
    "• Baris berwarna kuning adalah contoh format — HAPUS sebelum import",
    "• Gunakan format tanggal: YYYY-MM-DD (contoh: 2027-12-31)",
    "• Pegawai yang tidak ditemukan berdasarkan NIP akan dilewati (tidak membuat akun baru).",
    "• Simpan file sebagai .xlsx sebelum di-upload",
    "",
    "Dependensi antar sheet (proses import berurutan):",
    "  Pegawai bergantung pada: Jabatan (sheet 1)",
    "  SertifikasiPegawai bergantung pada: Pegawai (sheet 2)",
    "",
    "Jika ada baris gagal, sistem akan menyediakan file laporan error yang bisa diunduh.",
  ];

  instructions.forEach((text, i) => {
    const cell = ws.getCell(`A${i + 1}`);
    cell.value = text;
    if (i === 0) cell.font = { bold: true, size: 14 };
    else if (i === 1) cell.font = { bold: true };
  });

  ws.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: true,
  });
}

export async function buildKepegawaianExportWorkbook(
  data: KepegawaianExportData,
): Promise<Buffer> {
  const workbook = new exceljs.Workbook();

  const sheetKeys: (keyof KepegawaianExportData)[] = [
    "jabatan",
    "pegawai",
    "sertifikasi",
  ];

  sheetKeys.forEach((key) => {
    // Map key from KepegawaianExportData to KEPEGAWAIAN_EXCEL_SHEETS
    let sheetDef: SheetDefinition;
    if (key === "jabatan") sheetDef = KEPEGAWAIAN_EXCEL_SHEETS.jabatan;
    else if (key === "pegawai") sheetDef = KEPEGAWAIAN_EXCEL_SHEETS.pegawai;
    else sheetDef = KEPEGAWAIAN_EXCEL_SHEETS.sertifikasiPegawai;

    const ws = workbook.addWorksheet(sheetDef.sheetName);
    setupSheetHeaders(ws, sheetDef);

    const rowsData = data[key];
    rowsData.forEach((rowObj) => {
      const rowData: Record<string, any> = {};
      sheetDef.columns.forEach((col) => {
        rowData[col.key] = rowObj[col.key] ?? "";
      });
      ws.addRow(rowData);
    });

    applyDataValidation(ws, sheetDef, Math.max(2000, rowsData.length + 100));
  });

  addInstructionSheet(workbook);
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

export async function buildKepegawaianTemplateWorkbook(): Promise<Buffer> {
  const workbook = new exceljs.Workbook();

  const sheetKeys: (keyof typeof KEPEGAWAIAN_EXCEL_SHEETS)[] = [
    "jabatan",
    "pegawai",
    "sertifikasiPegawai",
  ];

  sheetKeys.forEach((key) => {
    const sheetDef = KEPEGAWAIAN_EXCEL_SHEETS[key];
    const ws = workbook.addWorksheet(sheetDef.sheetName);
    setupSheetHeaders(ws, sheetDef);

    const exampleData: Record<string, any> = {};
    sheetDef.columns.forEach((col, colIndex) => {
      ws.getCell(2, colIndex + 1).value = (col as any).exampleValue || "";
    });

    const exampleRow = ws.addRow(exampleData);
    exampleRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: EXCEL_STYLES.EXAMPLE_ROW_BG },
      };
      cell.font = { italic: true };
    });

    applyDataValidation(ws, sheetDef, 2000);
  });

  addInstructionSheet(workbook);
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

export async function buildKepegawaianErrorReport(
  reportData: KepegawaianImportReportData,
): Promise<Buffer> {
  const workbook = new exceljs.Workbook();
  const summaryWs = workbook.addWorksheet("Ringkasan Import");

  summaryWs.columns = [
    { header: "Keterangan", key: "desc", width: 30 },
    { header: "Nilai", key: "val", width: 20 },
  ];

  summaryWs.addRow({ desc: "Waktu Generate", val: new Date().toLocaleString("id-ID") });
  summaryWs.addRow({});
  
  Object.entries(reportData.summary).forEach(([sheetName, stats]) => {
    summaryWs.addRow({ desc: `Sheet: ${sheetName}` });
    summaryWs.addRow({ desc: "Total Baris Dibaca", val: stats.processed });
    summaryWs.addRow({ desc: "Berhasil Diproses", val: stats.success });
    summaryWs.addRow({ desc: "Gagal (Error)", val: stats.failed });
    summaryWs.addRow({});
  });

  summaryWs.getRow(1).font = { bold: true };
  
  const errorWs = workbook.addWorksheet("Detail Error");
  errorWs.columns = [
    { header: "Sheet", key: "sheet", width: 25 },
    { header: "Baris Excel", key: "row", width: 15 },
    { header: "Kolom/Field", key: "field", width: 25 },
    { header: "Pesan Error", key: "message", width: 80 },
  ];

  errorWs.getRow(1).font = { bold: true };
  errorWs.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF0000" },
  };
  
  reportData.errors.forEach((err) => {
    errorWs.addRow({
      sheet: err.sheet,
      row: err.row,
      field: err.field || "-",
      message: err.message,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}
