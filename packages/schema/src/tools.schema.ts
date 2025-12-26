import { tools } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_TOOL_FIELDS = [
  "toolName",
  "toolCode",
  "condition",
  "shelf",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof tools.$inferSelect)[];

const getAllToolsSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_TOOL_FIELDS),
        desc: z.boolean(),
      })
    )
    .default([{ id: "createdAt", desc: true }]),
  toolName: z.string().default(""),
  createdAt: z.array(z.coerce.number()).default([]),
  filters: z.array(filterSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  showDeleted: z.boolean().default(false),
});

const createToolSchema = createInsertSchema(tools);

const updateToolSchema = createUpdateSchema(tools, {
  id: z.uuidv7(),
});

const toolsSchema = {
  getAllToolsSchema,
  createToolSchema,
  updateToolSchema,
};

export default toolsSchema;
