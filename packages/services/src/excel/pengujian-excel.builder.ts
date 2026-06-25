import exceljs from "exceljs";
import { EXCEL_SHEETS, EXCEL_STYLES } from "@tepian-k3/constants";
import type { SheetDefinition } from "@tepian-k3/constants";

export interface ExportData {
  parameterCategories: Record<string, any>[];
  parameters: Record<string, any>[];
  toolCodes: Record<string, any>[];
  tools: Record<string, any>[];
  chemicalMaterials: Record<string, any>[];
}

export interface ImportReportData {
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

/**
 * Membangun berbagai jenis file .xlsx.
 *
 * Semua builder mengacu ke EXCEL_SHEETS dari column-definitions.ts
 * untuk konsistensi header, urutan kolom, dan lebar kolom.
 */

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
    "Petunjuk Penggunaan File Excel Master Data Pengujian K3",
    "═══════════════════════════════════════════════════════",
    "• File ini berisi 5 sheet: KategoriParameter, Parameter, KodeAlat, Alat, BahanKimia",
    "• Jangan ubah nama sheet atau urutan kolom",
    "• Kolom dengan tanda * wajib diisi",
    "• Kolom dengan dropdown → klik sel untuk melihat pilihan yang valid",
    "• Baris berwarna kuning adalah contoh format — HAPUS sebelum import",
    "• Gunakan format tanggal: YYYY-MM-DD (contoh: 2027-12-31)",
    "• Simpan file sebagai .xlsx sebelum di-upload",
    "",
    "Dependensi antar sheet (proses import berurutan):",
    "  KategoriParameter bergantung pada: Cluster (harus sudah ada di sistem)",
    "  Parameter bergantung pada: KategoriParameter (sheet 1)",
    "  Alat bergantung pada: KodeAlat (sheet 3)",
    "",
    "Jika ada baris gagal, sistem akan menyediakan file laporan error yang bisa diunduh.",
  ];

  instructions.forEach((text, i) => {
    const cell = ws.getCell(`A${i + 1}`);
    cell.value = text;
    if (i === 0) cell.font = { bold: true, size: 14 };
    else if (i === 1) cell.font = { bold: true };
  });

  // Protect sheet with empty password to prevent accidental edits
  ws.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: true,
  });
}

// Build file export dari data DB
export async function buildExportWorkbook(data: ExportData): Promise<Buffer> {
  const workbook = new exceljs.Workbook();

  const sheetKeys: (keyof ExportData)[] = [
    "parameterCategories",
    "parameters",
    "toolCodes",
    "tools",
    "chemicalMaterials",
  ];

  sheetKeys.forEach((key) => {
    const sheetDef = EXCEL_SHEETS[key];
    const ws = workbook.addWorksheet(sheetDef.sheetName);

    setupSheetHeaders(ws, sheetDef);

    // Add rows
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
  return buffer as any as Buffer;
}

// Build template kosong dengan 1 baris contoh + sheet petunjuk
export async function buildTemplateWorkbook(): Promise<Buffer> {
  const workbook = new exceljs.Workbook();

  const sheetKeys = Object.keys(EXCEL_SHEETS) as (keyof typeof EXCEL_SHEETS)[];

  sheetKeys.forEach((key) => {
    const sheetDef = EXCEL_SHEETS[key];
    const ws = workbook.addWorksheet(sheetDef.sheetName);

    setupSheetHeaders(ws, sheetDef);

    // Add example row
    const exampleRowData: Record<string, any> = {};
    sheetDef.columns.forEach((col) => {
      exampleRowData[col.key] = (col as any).exampleValue ?? "";
    });
    const row = ws.addRow(exampleRowData);

    // Style example row
    row.eachCell((cell) => {
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
  return buffer as any as Buffer;
}

// Build laporan hasil import
export async function buildImportReportWorkbook(
  data: ImportReportData,
): Promise<Buffer> {
  const workbook = new exceljs.Workbook();

  // Sheet 1: Ringkasan
  const wsSummary = workbook.addWorksheet("Ringkasan");
  wsSummary.columns = [
    { header: "Sheet", key: "sheet", width: 25 },
    { header: "Diproses", key: "processed", width: 15 },
    { header: "Sukses", key: "success", width: 15 },
    { header: "Gagal", key: "failed", width: 15 },
    { header: "Status", key: "status", width: 25 },
  ];

  // Header style summary
  wsSummary.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_STYLES.HEADER_REQUIRED_BG },
    };
    cell.font = { color: { argb: EXCEL_STYLES.HEADER_FONT_COLOR }, bold: true };
  });

  Object.entries(data.summary).forEach(([key, stats]) => {
    const sheetDef = EXCEL_SHEETS[key as keyof typeof EXCEL_SHEETS];
    const isAllSuccess = stats.failed === 0 && stats.processed > 0;

    const row = wsSummary.addRow({
      sheet: sheetDef ? sheetDef.sheetName : key,
      processed: stats.processed,
      success: stats.success,
      failed: stats.failed,
      status: isAllSuccess
        ? "✅ Semua berhasil"
        : stats.failed > 0
          ? "⚠ Ada error"
          : "-",
    });

    if (isAllSuccess) {
      row.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: EXCEL_STYLES.SUCCESS_ROW_BG },
          }),
      );
    } else if (stats.failed > 0) {
      row.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: EXCEL_STYLES.ERROR_ROW_BG },
          }),
      );
    }
  });

  // Sheet 2: Error Detail
  const wsErrors = workbook.addWorksheet("Error Detail");
  wsErrors.columns = [
    { header: "Sheet", key: "sheet", width: 25 },
    { header: "Nomor Baris", key: "row", width: 15 },
    { header: "Kolom", key: "field", width: 25 },
    { header: "Pesan Error", key: "message", width: 80 },
  ];

  // Header style errors
  wsErrors.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_STYLES.HEADER_REQUIRED_BG },
    };
    cell.font = { color: { argb: EXCEL_STYLES.HEADER_FONT_COLOR }, bold: true };
  });

  data.errors.forEach((err) => {
    wsErrors.addRow({
      sheet: err.sheet,
      row: err.row,
      field: err.field || "-",
      message: err.message,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as any as Buffer;
}
