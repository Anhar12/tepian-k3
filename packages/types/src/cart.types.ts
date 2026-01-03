import { cart } from "@tepian-k3/db/schema";

export type Cart = typeof cart.$inferSelect;

export type InsertCart = typeof cart.$inferInsert;
