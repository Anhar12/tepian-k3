import { parameterCategories } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_PARAMETER_CATEGORY_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof parameterCategories.$inferSelect)[];

const getAllParameterCategoriesSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_PARAMETER_CATEGORY_FIELDS),
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

const createParameterCategorySchema = createInsertSchema(parameterCategories, {
  name: z.string().min(1).max(256),
  clusterId: z.uuidv7(),
  description: z.optional(z.string().min(1).max(1000)),
});

const updateParameterCategorySchema = createUpdateSchema(parameterCategories, {
  id: z.uuidv7(),
  name: z.string().min(1).max(256),
  clusterId: z.uuidv7(),
  description: z.optional(z.string().min(1).max(1000)),
});

const parameterCategoriesSchema = {
  getAllParameterCategoriesSchema,
  createParameterCategorySchema,
  updateParameterCategorySchema,
};

export default parameterCategoriesSchema;
