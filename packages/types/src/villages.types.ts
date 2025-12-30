import { villages } from "@tepian-k3/db/schema";

export type Villages = typeof villages.$inferSelect;

export type InsertVillage = typeof villages.$inferInsert;
