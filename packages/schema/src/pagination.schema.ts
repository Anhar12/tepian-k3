import z from "zod";

/**
 * Shared pagination schema with validation bounds.
 * Use `.extend()` to add resource-specific fields like sort, filters, search.
 *
 * @example
 * ```ts
 * const getAllUsersSchema = paginationSchema.extend({
 *   sort: z.array(...).default([...]),
 *   filters: z.array(filterSchema).default([]),
 * });
 * ```
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
});
