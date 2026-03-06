import { clusters } from "@tepian-k3/db/schema";

export type Clusters = typeof clusters.$inferSelect;

export type InsertCluster = typeof clusters.$inferInsert;
