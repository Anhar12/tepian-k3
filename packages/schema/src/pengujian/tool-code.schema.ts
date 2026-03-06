import { toolCodes } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "../platform/pagination.schema";

export const SORTABLE_TOOL_CODE_FIELDS = [
  "code",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof toolCodes.$inferSelect)[];

const getAllToolCodesSchema = createPaginationSchema(
  SORTABLE_TOOL_CODE_FIELDS,
).extend({
  code: z.string().default(""),
  isActive: z.boolean().optional(),
});

const createToolCodeSchema = createInsertSchema(toolCodes, {
  code: z.string().min(1).max(256),
  description: z.string().optional(),
  isActive: z.boolean(),
});

const updateToolCodeSchema = createUpdateSchema(toolCodes, {
  id: z.uuidv7(),
});

const toolCodeSchema = {
  getAllToolCodesSchema,
  createToolCodeSchema,
  updateToolCodeSchema,
};

export default toolCodeSchema;
