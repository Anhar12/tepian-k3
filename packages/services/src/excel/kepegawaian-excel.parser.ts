import exceljs from "exceljs";
import { z } from "zod";
import { EXCEL_LIMITS, KEPEGAWAIAN_EXCEL_SHEETS } from "@tepian-k3/constants";
import {
  excelJabatanRowSchema,
  excelPegawaiRowSchema,
  excelSertifikasiRowSchema,
} from "@tepian-k3/schema/platform/kepegawaian-excel.schema";
import type {
  ExcelJabatanRow,
  ExcelPegawaiRow,
  ExcelSertifikasiRow,
} from "@tepian-k3/schema/platform/kepegawaian-excel.schema";

export interface KepegawaianValidRow<T> {
  rowNumber: number;
  data: T;
}

export interface KepegawaianParseError {
  sheet: string;
  row: number;
  field?: string;
  message: string;
}

export interface KepegawaianParseResult {
  jabatan: KepegawaianValidRow<ExcelJabatanRow>[];
  pegawai: KepegawaianValidRow<ExcelPegawaiRow>[];
  sertifikasi: KepegawaianValidRow<ExcelSertifikasiRow>[];
  parseErrors: KepegawaianParseError[];
}

/**
 * Membaca file .xlsx dan mengembalikan data terstruktur per sheet.
 */
export async function parseKepegawaianExcelBuffer(
  buffer: Buffer,
): Promise<KepegawaianParseResult> {
  const result: KepegawaianParseResult = {
    jabatan: [],
    pegawai: [],
    sertifikasi: [],
    parseErrors: [],
  };

  const workbook = new exceljs.Workbook();
  await workbook.xlsx.load(buffer as any);

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;
    const rowCount = worksheet.rowCount;

    if (rowCount > EXCEL_LIMITS.MAX_ROWS_PER_SHEET + 1) {
      result.parseErrors.push({
        sheet: sheetName,
        row: 0,
        message: `Sheet memiliki lebih dari ${EXCEL_LIMITS.MAX_ROWS_PER_SHEET} baris. Hanya ${EXCEL_LIMITS.MAX_ROWS_PER_SHEET} baris pertama yang akan diproses.`,
      });
    }

    if (sheetName === KEPEGAWAIAN_EXCEL_SHEETS.jabatan.sheetName) {
      parseSheet(
        worksheet,
        KEPEGAWAIAN_EXCEL_SHEETS.jabatan.columns,
        excelJabatanRowSchema,
        result.jabatan,
        result.parseErrors,
      );
    } else if (sheetName === KEPEGAWAIAN_EXCEL_SHEETS.pegawai.sheetName) {
      parseSheet(
        worksheet,
        KEPEGAWAIAN_EXCEL_SHEETS.pegawai.columns,
        excelPegawaiRowSchema,
        result.pegawai,
        result.parseErrors,
      );
    } else if (
      sheetName === KEPEGAWAIAN_EXCEL_SHEETS.sertifikasiPegawai.sheetName
    ) {
      parseSheet(
        worksheet,
        KEPEGAWAIAN_EXCEL_SHEETS.sertifikasiPegawai.columns,
        excelSertifikasiRowSchema,
        result.sertifikasi,
        result.parseErrors,
      );
    }
  }

  return result;
}

function parseSheet<T>(
  worksheet: exceljs.Worksheet,
  columnsConfig: { key: string; header: string }[],
  schema: z.ZodType<T>,
  validRowsArray: KepegawaianValidRow<T>[],
  parseErrorsArray: KepegawaianParseError[],
) {
  const sheetName = worksheet.name;
  let isFirstRow = true;
  
  worksheet.eachRow((row, rowNumber) => {
    if (isFirstRow) {
      isFirstRow = false;
      return;
    }

    if (rowNumber > EXCEL_LIMITS.MAX_ROWS_PER_SHEET + 1) {
      return;
    }

    const rawData: Record<string, any> = {};
    let isEmptyRow = true;

    columnsConfig.forEach((col, index) => {
      const cell = row.getCell(index + 1);

      let cellValue = cell.value;
      if (cellValue && typeof cellValue === "object" && "result" in cellValue) {
        cellValue = (cellValue as exceljs.CellFormulaValue).result;
      }
      if (
        cellValue &&
        typeof cellValue === "object" &&
        "richText" in cellValue
      ) {
        cellValue = (cellValue as exceljs.CellRichTextValue).richText
          .map((rt) => rt.text)
          .join("");
      }

      rawData[col.key] =
        cellValue !== null && cellValue !== undefined ? cellValue : "";

      if (rawData[col.key] !== "") {
        isEmptyRow = false;
      }
    });

    if (isEmptyRow) {
      return;
    }

    const validation = schema.safeParse(rawData);
    if (validation.success) {
      validRowsArray.push({
        rowNumber,
        data: validation.data,
      });
    } else {
      validation.error.issues.forEach((zodError: z.ZodIssue) => {
        const fieldKey = zodError.path[0]?.toString() || "";
        const colDef = columnsConfig.find((c) => c.key === fieldKey);
        const colHeader = colDef ? colDef.header.replace("*", "") : fieldKey;

        parseErrorsArray.push({
          sheet: sheetName,
          row: rowNumber,
          field: fieldKey,
          message: `Baris ${rowNumber} (Sheet ${sheetName}): ${zodError.message} (Kolom "${colHeader}")`,
        });
      });
    }
  });
}
