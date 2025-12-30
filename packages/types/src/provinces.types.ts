import { provinces } from "@tepian-k3/db/schema";

export type Provinces = typeof provinces.$inferSelect;

export type InsertProvince = typeof provinces.$inferInsert;
