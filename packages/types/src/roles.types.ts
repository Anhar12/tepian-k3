import { roles } from "@tepian-k3/db/schema";

export type Roles = typeof roles.$inferSelect;

export type InsertRole = typeof roles.$inferInsert;
