import { districts } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_DISTRICT_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof districts.$inferSelect)[];

const getAllDistrictsSchema = createPaginationSchema(
  SORTABLE_DISTRICT_FIELDS,
).extend({
  name: z.string().default(""),
});

const createDistrictSchema = createInsertSchema(districts, {
  regencyId: z.uuidv7(),
  name: z.string().min(1).max(256),
});

const updateDistrictSchema = createUpdateSchema(districts, {
  id: z.uuidv7(),
  regencyId: z.optional(z.uuidv7()),
  name: z.optional(z.string().min(1).max(256)),
});

const districtSchema = {
  getAllDistrictsSchema,
  createDistrictSchema,
  updateDistrictSchema,
};

export default districtSchema;
