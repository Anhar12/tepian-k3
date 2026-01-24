import { orderStatusHistory } from "@tepian-k3/db/schema";

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;

export type InsertOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
