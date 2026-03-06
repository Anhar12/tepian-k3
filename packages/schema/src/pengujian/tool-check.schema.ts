import { toolChecks } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "../platform/pagination.schema";
import { TOOLS_CONDITIONS } from "@tepian-k3/constants";

export const SORTABLE_TOOL_CHECK_FIELDS = [
  "checkPenyimpangan",
  "checkKelengkapanAlat",
  "checkKondisiFisikAlat",
  "checkConditionResult",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof toolChecks.$inferSelect)[];

const getAllToolChecksSchema = createPaginationSchema(
  SORTABLE_TOOL_CHECK_FIELDS,
).extend({
  checkPenyimpangan: z.boolean().default(false),
  checkKelengkapanAlat: z.boolean().default(false),
  checkKondisiFisikAlat: z.boolean().default(false),
  checkConditionResult: z.enum(TOOLS_CONDITIONS).default("baik"),
});

const createToolCheckSchema = createInsertSchema(toolChecks, {
  toolId: z.uuidv7("ID alat wajib diisi"),
  checkPenyimpangan: z.boolean(),
  checkKelengkapanAlat: z.boolean(),
  checkKondisiFisikAlat: z.boolean(),
  checkConditionResult: z.enum(TOOLS_CONDITIONS),
}).omit({
  checkedBy: true, // will be set in backend based on user performing the check
});

const updateToolCheckSchema = createUpdateSchema(toolChecks, {
  checkPenyimpangan: z.boolean().optional(),
  checkKelengkapanAlat: z.boolean().optional(),
  checkKondisiFisikAlat: z.boolean().optional(),
  checkConditionResult: z.enum(TOOLS_CONDITIONS).optional(),
}).omit({
  toolId: true, // should not be updatable
  checkedBy: true, // should not be updatable
});

const toolCheckSchema = {
  getAllToolChecksSchema,
  createToolCheckSchema,
  updateToolCheckSchema,
};

export default toolCheckSchema;
