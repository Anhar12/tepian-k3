import { toolCalibrations } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_TOOL_CALIBRATION_FIELDS = [
  "calibrationDate",
  "note",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof toolCalibrations.$inferSelect)[];

const getAllToolCalibrationsSchema = createPaginationSchema(
  SORTABLE_TOOL_CALIBRATION_FIELDS,
).extend({
  note: z.string().default(""),
  calibrationDate: z.array(z.coerce.number()).default([]),
});

const createToolCalibrationSchema = createInsertSchema(toolCalibrations, {
  toolId: z.uuidv7("ID alat wajib diisi"),
  calibrationDate: z.string().min(1, "Tanggal kalibrasi wajib diisi"),
  note: z.string().min(1, "Catatan kalibrasi wajib diisi").max(2555),
}).extend({
  certificateFile: z
    .file()
    .max(5 * 1024 * 1024, "Ukuran file maksimal 5MB")
    .mime(["application/pdf"], "Format file harus PDF")
    .optional(),
  documentationFiles: z
    .array(
      z
        .file()
        .max(5 * 1024 * 1024, "Ukuran file maksimal 5MB")
        .mime(["image/jpeg", "image/png"], "Format file harus JPEG atau PNG"),
    )
    .max(5, "Maksimal 5 file dokumentasi")
    .optional(),
});

const createToolCertificationSchema = z.object({
  toolCalibrationId: z.uuidv7("ID kalibrasi alat wajib diisi"),
  certificationFile: z
    .file()
    .max(5 * 1024 * 1024, "Ukuran file maksimal 5MB")
    .mime(["application/pdf"], "Format file harus PDF"),
});

const createToolDocumentationSchema = z.object({
  toolCalibrationId: z.uuidv7("ID kalibrasi alat wajib diisi"),
  documentationFiles: z
    .array(
      z
        .file()
        .max(5 * 1024 * 1024, "Ukuran file maksimal 5MB")
        .mime(["image/jpeg", "image/png"], "Format file harus JPEG atau PNG"),
    )
    .max(5, "Maksimal 5 file dokumentasi"),
});

const updateToolCalibrationSchema = createUpdateSchema(toolCalibrations, {
  id: z.uuidv7(),
  calibrationDate: z
    .string()
    .min(1, "Tanggal kalibrasi wajib diisi")
    .optional(),
  note: z.string().min(1, "Catatan kalibrasi wajib diisi").max(2555).optional(),
}).extend({
  certificateFile: z
    .file()
    .max(5 * 1024 * 1024, "Ukuran file maksimal 5MB")
    .mime(["application/pdf"], "Format file harus PDF")
    .optional(),
  documentationFiles: z
    .array(
      z
        .file()
        .max(5 * 1024 * 1024, "Ukuran file maksimal 5MB")
        .mime(["image/jpeg", "image/png"], "Format file harus JPEG atau PNG"),
    )
    .max(5, "Maksimal 5 file dokumentasi")
    .optional(),
});

const toolCalibrationSchema = {
  getAllToolCalibrationsSchema,
  createToolCalibrationSchema,
  createToolCertificationSchema,
  createToolDocumentationSchema,
  updateToolCalibrationSchema,
};

export default toolCalibrationSchema;
