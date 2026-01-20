import { positions } from "@tepian-k3/db/schema";
import type { Positions } from "@tepian-k3/types/position.types";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

const SORTABLE_POSITION_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof Positions)[];

const getAllPositionsSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_POSITION_FIELDS),
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

const createPositionSchema = createInsertSchema(positions, {
  name: z.string().min(1),
  description: z.string().optional(),
});

const updatePositionSchema = createUpdateSchema(positions, {
  id: z.uuidv7(),
  name: z.string().min(1),
  description: z.string().optional(),
});

const positionSchema = {
  getAllPositionsSchema,
  createPositionSchema,
  updatePositionSchema,
};

export default positionSchema;
