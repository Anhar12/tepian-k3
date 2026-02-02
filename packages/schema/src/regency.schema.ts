import { regencies } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_REGENCY_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof regencies.$inferSelect)[];

const getAllRegenciesSchema = createPaginationSchema(
  SORTABLE_REGENCY_FIELDS,
).extend({
  name: z.string().default(""),
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
