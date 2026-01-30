import { districts } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_DISTRICT_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof districts.$inferSelect)[];

const getAllDistrictsSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_DISTRICT_FIELDS),
        desc: z.boolean(),
      }),
    )
    .default([{ id: "createdAt", desc: false }]),
  name: z.string().default(""),
  createdAt: z.array(z.coerce.number()).default([]),
  filters: z.array(filterSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  showDeleted: z.boolean().default(false),
});

const createDistrictSchema = createInsertSchema(districts, {
  regencyId: z.uuidv7(),
  oldRegencyId: z.string().min(1).max(50),
  name: z.string().min(1).max(256),
});

const updateDistrictSchema = createUpdateSchema(districts, {
  id: z.uuidv7(),
  regencyId: z.optional(z.uuidv7()),
  oldRegencyId: z.optional(z.string().min(1).max(50)),
  name: z.optional(z.string().min(1).max(256)),
});

const districtSchema = {
  getAllDistrictsSchema,
  createDistrictSchema,
  updateDistrictSchema,
};

export default districtSchema;
