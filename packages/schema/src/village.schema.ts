import { villages } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_VILLAGE_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof villages.$inferSelect)[];

const getAllVillagesSchema = createPaginationSchema(
  SORTABLE_VILLAGE_FIELDS,
).extend({
  name: z.string().default(""),
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
