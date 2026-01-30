import { tools } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";
import { TOOLS_CONDITIONS } from "@tepian-k3/constants";
import { TOOLS_AVAILABILITY } from "@tepian-k3/constants";

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
      }),
    )
    .default([{ id: "createdAt", desc: false }]),
  toolName: z.string().default(""),
  createdAt: z.array(z.coerce.number()).default([]),
  filters: z.array(filterSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  showDeleted: z.boolean().default(false),
});

const createToolSchema = createInsertSchema(tools, {
  toolCode: z.string().min(1).max(256),
  toolName: z.string().min(1).max(256),
  function: z.string().optional(),
  location: z.string().optional(),
  shelf: z.string().optional(),
  BMNnumber: z.string().max(100).optional(),
  NUPnumber: z.string().max(100).optional(),
  brand: z.string().optional(),
  type: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(TOOLS_CONDITIONS),
  availability: z.enum(TOOLS_AVAILABILITY),
});

const updateToolSchema = createUpdateSchema(tools, {
  id: z.uuidv7(),
});

const toolsSchema = {
  getAllToolsSchema,
  createToolSchema,
  updateToolSchema,
};

export default toolsSchema;
