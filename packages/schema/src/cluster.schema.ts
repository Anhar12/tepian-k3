import { clusters } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_CLUSTER_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof clusters.$inferSelect)[];

const getAllClustersSchema = createPaginationSchema(
  SORTABLE_CLUSTER_FIELDS,
).extend({
  name: z.string().default(""),
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
