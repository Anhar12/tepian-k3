import { villages } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_VILLAGE_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof villages.$inferSelect)[];

const getAllVillagesSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_VILLAGE_FIELDS),
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

const createVillageSchema = createInsertSchema(villages, {
  districtId: z.uuidv7(),
  oldDistrictId: z.string().min(1).max(50),
  name: z.string().min(1).max(256),
});

const updateVillageSchema = createUpdateSchema(villages, {
  id: z.uuidv7(),
  oldId: z.optional(z.string().min(1).max(50)),
  districtId: z.optional(z.uuidv7()),
  oldDistrictId: z.optional(z.string().min(1).max(50)),
  name: z.optional(z.string().min(1).max(256)),
});

const villageSchema = {
  getAllVillagesSchema,
  createVillageSchema,
  updateVillageSchema,
};

export default villageSchema;
