import { toolCodes } from "@tepian-k3/db/schema";

export type ToolCodes = typeof toolCodes.$inferSelect;

export type InsertToolCode = typeof toolCodes.$inferInsert;
