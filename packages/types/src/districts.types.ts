import { districts } from "@tepian-k3/db/schema";

export type Districts = typeof districts.$inferSelect;

export type InsertDistrict = typeof districts.$inferInsert;
