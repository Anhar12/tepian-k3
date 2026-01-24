import { toolCalibrationCertificates } from "@tepian-k3/db/schema";

export type ToolCalibrationCertificate =
  typeof toolCalibrationCertificates.$inferSelect;

export type InsertToolCalibrationCertificate =
  typeof toolCalibrationCertificates.$inferInsert;
