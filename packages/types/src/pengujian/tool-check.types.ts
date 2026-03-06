import { toolChecks } from "@tepian-k3/db/schema";

export type ToolCheck = typeof toolChecks.$inferSelect;

export type InsertToolCheck = typeof toolChecks.$inferInsert;
