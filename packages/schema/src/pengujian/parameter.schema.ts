import { parameters } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "../platform/pagination.schema";

export const SORTABLE_PARAMETER_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof parameters.$inferSelect)[];

const getAllParametersSchema = createPaginationSchema(
  SORTABLE_PARAMETER_FIELDS,
).extend({
  name: z.string().default(""),
  companyId: z.optional(z.uuidv7()),
  locationId: z.optional(z.uuidv7()),
});

const getByClusterAndParameterCategorySchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  clusterId: z.string().default(""),
  parameterCategoryId: z.string().default(""),
  name: z.string().default(""),
});

const createParameterSchema = createInsertSchema(parameters, {
  name: z.string().min(1).max(256),
  parameterCategoryId: z.uuidv7(),
  price: z.number().min(0),
  unit: z.string().min(1).max(255),
  reference: z.string().min(1).max(512),
});

const updateParameterSchema = createUpdateSchema(parameters, {
  id: z.uuidv7(),
  name: z.string().min(1).max(256),
  parameterCategoryId: z.uuidv7(),
  price: z.number().min(0),
  unit: z.string().min(1).max(255),
  reference: z.string().min(1).max(512),
});

const parameterSchema = {
  getAllParametersSchema,
  getByClusterAndParameterCategorySchema,
  createParameterSchema,
  updateParameterSchema,
};

export default parameterSchema;
