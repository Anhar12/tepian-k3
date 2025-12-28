import { tools } from "@tepian-k3/db/schema";

export type Tools = typeof tools.$inferSelect;

export type InsertTool = typeof tools.$inferInsert;
