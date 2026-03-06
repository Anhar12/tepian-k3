import { provinces } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_PROVINCE_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof provinces.$inferSelect)[];

const getAllProvincesSchema = createPaginationSchema(
  SORTABLE_PROVINCE_FIELDS,
).extend({
  name: z.string().default(""),
});

const createProvinceSchema = createInsertSchema(provinces, {
  name: z.string().min(1).max(256),
});

const updateProvinceSchema = createUpdateSchema(provinces, {
  id: z.uuidv7(),
  name: z.optional(z.string().min(1).max(256)),
});

const provinceSchema = {
  getAllProvincesSchema,
  createProvinceSchema,
  updateProvinceSchema,
};

export default provinceSchema;
