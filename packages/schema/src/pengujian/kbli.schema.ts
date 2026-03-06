import { kblis } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "../platform/pagination.schema";

export const SORTABLE_KBLI_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
] as const satisfies readonly (keyof typeof kblis.$inferSelect)[];

const getAllKBLISchema = createPaginationSchema(SORTABLE_KBLI_FIELDS).extend({
  name: z.string().default(""),
});

const createKBLISchema = createInsertSchema(kblis, {
  name: z.string().min(1).max(256),
});

const updateKBLISchema = createUpdateSchema(kblis, {
  id: z.uuidv7(),
  name: z.optional(z.string().min(1).max(256)),
});

const kbliSchema = {
  getAllKBLISchema,
  createKBLISchema,
  updateKBLISchema,
};

export default kbliSchema;
