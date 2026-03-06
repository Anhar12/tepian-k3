import { banners } from "@tepian-k3/db/schema";

export type Banner = typeof banners.$inferSelect;

export type InsertBanner = typeof banners.$inferInsert;
