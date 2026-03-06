import { tools } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { TOOLS_CONDITIONS } from "@tepian-k3/constants";
import { TOOLS_AVAILABILITY } from "@tepian-k3/constants";
import { createPaginationSchema } from "../platform/pagination.schema";

export const SORTABLE_TOOL_FIELDS = [
  "toolName",
  "toolCodeId",
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
  toolCodeId: z.uuidv7(),
  toolUniqueCode: z
    .string()
    .max(256)
    .regex(/^[0-9]+$/, "Hanya boleh menggunakan angka"),
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
  toolCodeId: z.uuidv7(),
  toolUniqueCode: z
    .string()
    .max(256)
    .regex(/^[0-9]+$/, "Hanya boleh menggunakan angka"),
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

const checkToolSchema = z.object({
  toolId: z.uuidv7(),
  checkAlatMenyala: z.boolean(),
  checkPenyimpangan: z.boolean(),
  checkKelengkapanAlat: z.boolean(),
  checkKondisiFisikAlat: z.boolean(),
  checkConditionResult: z.enum(TOOLS_CONDITIONS),
});

const getToolCheckHistorySchema = z.object({
  toolId: z.uuidv7(),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
});

const toolsSchema = {
  getAllToolsSchema,
  createToolSchema,
  updateToolSchema,
  checkToolSchema,
  getToolCheckHistorySchema,
};

export default toolsSchema;
