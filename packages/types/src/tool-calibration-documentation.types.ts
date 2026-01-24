import { toolCalibrationDocumentations } from "@tepian-k3/db/schema";

export type ToolCalibrationDocumentation =
  typeof toolCalibrationDocumentations.$inferSelect;

export type InsertToolCalibrationDocumentation =
  typeof toolCalibrationDocumentations.$inferInsert;
