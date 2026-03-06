import { toolCalibrations } from "@tepian-k3/db/schema";

export type ToolCalibration = typeof toolCalibrations.$inferSelect;

export type InsertToolCalibration = typeof toolCalibrations.$inferInsert;
