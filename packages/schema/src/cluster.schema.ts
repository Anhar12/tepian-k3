import { clusters } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_CLUSTER_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof clusters.$inferSelect)[];

const getAllClustersSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_CLUSTER_FIELDS),
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

const createClusterSchema = createInsertSchema(clusters, {
  name: z.string().min(1).max(256),
  description: z.optional(z.string().min(1).max(1000)),
});

const updateClusterSchema = createUpdateSchema(clusters, {
  id: z.uuidv7(),
  name: z.optional(z.string().min(1).max(256)),
  description: z.optional(z.string().min(1).max(1000)),
});

const clusterSchema = {
  getAllClustersSchema,
  createClusterSchema,
  updateClusterSchema,
};

export default clusterSchema;
