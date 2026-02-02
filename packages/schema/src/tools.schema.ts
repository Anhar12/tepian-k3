import { tools } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { TOOLS_CONDITIONS } from "@tepian-k3/constants";
import { TOOLS_AVAILABILITY } from "@tepian-k3/constants";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_TOOL_FIELDS = [
  "toolName",
  "toolCode",
  "condition",
  "shelf",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof tools.$inferSelect)[];

const getAllToolsSchema = createPaginationSchema(SORTABLE_TOOL_FIELDS).extend({
  toolName: z.string().default(""),
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
