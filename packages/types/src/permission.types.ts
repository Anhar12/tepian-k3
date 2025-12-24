import type { permission } from "@tepian-k3/db/schema";

export type Permission = typeof permission.$inferSelect;
