import exceljs from "exceljs";
import { z } from "zod";
import { EXCEL_LIMITS, EXCEL_SHEETS } from "@tepian-k3/constants";
import {
  excelParameterCategoryRowSchema,
  excelParameterRowSchema,
  excelToolCodeRowSchema,
  excelToolRowSchema,
  excelChemicalMaterialRowSchema,
} from "@tepian-k3/schema/pengujian/pengujian-excel.schema";
import type {
  ExcelParameterCategoryRow,
  ExcelParameterRow,
  ExcelToolCodeRow,
  ExcelToolRow,
  ExcelChemicalMaterialRow,
} from "@tepian-k3/schema/pengujian/pengujian-excel.schema";

export interface ValidRow<T> {
  rowNumber: number;
  data: T;
}

export interface ParseError {
  sheet: string;
  row: number;
  field?: string;
  message: string;
}

export interface ParseResult {
  parameterCategories: ValidRow<ExcelParameterCategoryRow>[];
  parameters: ValidRow<ExcelParameterRow>[];
  toolCodes: ValidRow<ExcelToolCodeRow>[];
  tools: ValidRow<ExcelToolRow>[];
  chemicalMaterials: ValidRow<ExcelChemicalMaterialRow>[];
  parseErrors: ParseError[];
}

/**
 * Membaca file .xlsx dan mengembalikan data terstruktur per sheet.
 *
 * Layer ini HANYA bertanggung jawab untuk:
 * 1. Membaca cell Excel → raw string/number
 * 2. Memvalidasi setiap baris dengan Zod schema yang sesuai
 * 3. Mengumpulkan error per baris tanpa menghentikan proses
 */
export async function parsePengujianExcelBuffer(
  buffer: Buffer,
): Promise<ParseResult> {
  const result: ParseResult = {
    parameterCategories: [],
    parameters: [],
    toolCodes: [],
    tools: [],
    chemicalMaterials: [],
    parseErrors: [],
  };

  const workbook = new exceljs.Workbook();
  await workbook.xlsx.load(buffer as any);

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;
    const rowCount = worksheet.rowCount;

    if (rowCount > EXCEL_LIMITS.MAX_ROWS_PER_SHEET + 1) {
      // +1 for header
      result.parseErrors.push({
        sheet: sheetName,
        row: 0,
        message: `Sheet memiliki lebih dari ${EXCEL_LIMITS.MAX_ROWS_PER_SHEET} baris. Hanya ${EXCEL_LIMITS.MAX_ROWS_PER_SHEET} baris pertama yang akan diproses.`,
      });
    }

    if (sheetName === EXCEL_SHEETS.parameterCategories.sheetName) {
      parseSheet(
        worksheet,
        EXCEL_SHEETS.parameterCategories.columns,
        excelParameterCategoryRowSchema,
        result.parameterCategories,
        result.parseErrors,
      );
    } else if (sheetName === EXCEL_SHEETS.parameters.sheetName) {
      parseSheet(
        worksheet,
        EXCEL_SHEETS.parameters.columns,
        excelParameterRowSchema,
        result.parameters,
        result.parseErrors,
      );
    } else if (sheetName === EXCEL_SHEETS.toolCodes.sheetName) {
      parseSheet(
        worksheet,
        EXCEL_SHEETS.toolCodes.columns,
        excelToolCodeRowSchema,
        result.toolCodes,
        result.parseErrors,
      );
    } else if (sheetName === EXCEL_SHEETS.tools.sheetName) {
      parseSheet(
        worksheet,
        EXCEL_SHEETS.tools.columns,
        excelToolRowSchema,
        result.tools,
        result.parseErrors,
      );
    } else if (sheetName === EXCEL_SHEETS.chemicalMaterials.sheetName) {
      parseSheet(
        worksheet,
        EXCEL_SHEETS.chemicalMaterials.columns,
        excelChemicalMaterialRowSchema,
        result.chemicalMaterials,
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
  validRowsArray: ValidRow<T>[],
  parseErrorsArray: ParseError[],
) {
  const sheetName = worksheet.name;

  // Baris pertama diasumsikan header, kita mulai iterasi dari baris ke-2 (atau ke-3 jika ada baris contoh)
  // Untuk amannya, kita iterasi baris menggunakan worksheet.eachRow
  let isFirstRow = true;
  worksheet.eachRow((row, rowNumber) => {
    if (isFirstRow) {
      isFirstRow = false;
      return; // Skip header
    }

    if (rowNumber > EXCEL_LIMITS.MAX_ROWS_PER_SHEET + 1) {
      return; // Hentikan parsing jika melebihi batas
    }

    const rawData: Record<string, any> = {};
    let isEmptyRow = true;

    // Baca cell sesuai urutan kolom dari column-definitions
    columnsConfig.forEach((col, index) => {
      // exceljs cell index is 1-based
      const cell = row.getCell(index + 1);

      let cellValue = cell.value;
      // Jika cell adalah rumus, ambil result-nya
      if (cellValue && typeof cellValue === "object" && "result" in cellValue) {
        cellValue = (cellValue as exceljs.CellFormulaValue).result;
      }
      // Jika cellValue adalah rich text
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
      return; // Skip baris kosong
    }

    // Validasi Zod
    const validation = schema.safeParse(rawData);
    if (validation.success) {
      validRowsArray.push({
        rowNumber,
        data: validation.data,
      });
    } else {
      // Map Zod errors ke ParseError dengan format human-friendly
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
