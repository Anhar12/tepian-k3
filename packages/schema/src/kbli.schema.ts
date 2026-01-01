import { kblis } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_KBLI_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
] as const satisfies readonly (keyof typeof kblis.$inferSelect)[];

const getAllKBLISchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_KBLI_FIELDS),
        desc: z.boolean(),
      })
    )
    .default([{ id: "createdAt", desc: false }]),
  name: z.string().default(""),
  createdAt: z.array(z.coerce.number()).default([]),
  filters: z.array(filterSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  showDeleted: z.boolean().default(false),
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
