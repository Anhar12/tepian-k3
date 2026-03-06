import { positions } from "@tepian-k3/db/schema";
import type { Positions } from "@tepian-k3/types/platform/position.types";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

const SORTABLE_POSITION_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof Positions)[];

const getAllPositionsSchema = createPaginationSchema(
  SORTABLE_POSITION_FIELDS,
).extend({
  name: z.string().default(""),
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
