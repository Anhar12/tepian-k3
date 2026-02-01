import { news } from "@tepian-k3/db/schema";

export type News = typeof news.$inferSelect;

export type InsertNews = typeof news.$inferInsert;
