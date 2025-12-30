import { regencies } from "@tepian-k3/db/schema";

export type Regencies = typeof regencies.$inferSelect;

export type InsertRegency = typeof regencies.$inferInsert;
