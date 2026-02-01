import { parameterCategories } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_PARAMETER_CATEGORY_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof parameterCategories.$inferSelect)[];

const getAllParameterCategoriesSchema = createPaginationSchema(
  SORTABLE_PARAMETER_CATEGORY_FIELDS,
).extend({
  name: z.string().default(""),
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
