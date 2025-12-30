import { kblis } from "@tepian-k3/db/schema";

export type KBLI = typeof kblis.$inferSelect;

export type InsertKBLI = typeof kblis.$inferInsert;
