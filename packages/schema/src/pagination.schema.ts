import z from "zod";
import { filterSchema } from "./filter.schema";

/**
 * Creates a reusable pagination schema with shared filtering, sorting, and soft-delete fields.
 * Pass in your resource-specific sortable fields enum to generate a fully typed schema.
 *
 * @example
 * ```ts
 * const SORTABLE_CLUSTER_FIELDS = ["name", "createdAt", "updatedAt"] as const;
 *
 * const getAllClustersSchema = createPaginationSchema(SORTABLE_CLUSTER_FIELDS).extend({
 *   name: z.string().default(""),
 * });
 * ```
 */
export function createPaginationSchema<
  T extends readonly [string, ...string[]],
>(
  sortableFields: T,
  defaultSort: { id: T[number]; desc: boolean } = {
    id: sortableFields[0],
    desc: false,
  },
) {
  return z.object({
    page: z.number().int().min(1).default(1),
    perPage: z.number().int().min(1).max(100).default(10),
    sort: z
      .array(
        z.object({
          id: z.enum(sortableFields),
          desc: z.boolean(),
        }),
      )
      .default([defaultSort]),
    createdAt: z.array(z.coerce.number()).default([]),
    filters: z.array(filterSchema).default([]),
    joinOperator: z.enum(["and", "or"]).default("and"),
    showDeleted: z.boolean().default(false),
  });
}
