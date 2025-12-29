import { parameters } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_PARAMETER_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof parameters.$inferSelect)[];

const getAllParametersSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_PARAMETER_FIELDS),
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

const createParameterSchema = createInsertSchema(parameters, {
  name: z.string().min(1).max(256),
  parameterCategoryId: z.uuidv7(),
  price: z.number().min(0),
  reference: z.string().min(1).max(512),
});

const updateParameterSchema = createUpdateSchema(parameters, {
  id: z.uuidv7(),
  name: z.string().min(1).max(256),
  parameterCategoryId: z.uuidv7(),
  price: z.number().min(0),
  reference: z.string().min(1).max(512),
});

const parameterSchema = {
  getAllParametersSchema,
  createParameterSchema,
  updateParameterSchema,
};

export default parameterSchema;
