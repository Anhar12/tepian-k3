import { regencies } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_REGENCY_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof regencies.$inferSelect)[];

const getAllRegenciesSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_REGENCY_FIELDS),
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

const createRegencySchema = createInsertSchema(regencies, {
  provinceId: z.uuidv7(),
  oldProvinceId: z.optional(z.string().min(1).max(50)),
  name: z.string().min(1).max(256),
});

const updateRegencySchema = createUpdateSchema(regencies, {
  id: z.uuidv7(),
  provinceId: z.optional(z.uuidv7()),
  oldProvinceId: z.optional(z.string().min(1).max(50)),
  name: z.optional(z.string().min(1).max(256)),
});

const regencySchema = {
  getAllRegenciesSchema,
  createRegencySchema,
  updateRegencySchema,
};

export default regencySchema;
