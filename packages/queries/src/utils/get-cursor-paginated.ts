import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import {
  and,
  asc,
  desc,
  gt,
  gte,
  isNotNull,
  isNull,
  lt,
  lte,
  type SQL,
  type Table,
} from "@tepian-k3/db";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import type { JoinOperator } from "@tepian-k3/types/data-table.types";

interface CursorPaginatedInput {
  cursor?: string; // UUIDv7 of the last item from previous page
  limit: number;
  sort: { id: string; desc: boolean };
  filters: unknown[];
  joinOperator: JoinOperator;
  showDeleted: boolean;
  createdAt: number[];
}

interface GetCursorPaginatedOptions<T extends Table> {
  table: T;
  input: CursorPaginatedInput;
  /** The column to use for cursor pagination (usually "id" for UUIDv7) */
  cursorColumn?: string;
  /** Additional where conditions for simple (non-advanced) filtering (e.g. ilike on name) */
  searchConditions?: (SQL | undefined)[];
  errorContext: {
    queryName: string;
    errorMessage: string;
  };
}

export function getCursorPaginated<T extends Table>({
  table,
  input,
  cursorColumn = "id",
  searchConditions,
  errorContext,
}: GetCursorPaginatedOptions<T>) {
  return Effect.gen(function* () {
    const advancedTable = input.filters && input.filters.length > 0;

    // Build cursor condition
    const cursorCondition = input.cursor
      ? input.sort.desc
        ? lt(
            (table as Record<string, unknown>)[cursorColumn] as SQL,
            input.cursor,
          )
        : gt(
            (table as Record<string, unknown>)[cursorColumn] as SQL,
            input.cursor,
          )
      : undefined;

    const where = advancedTable
      ? and(
          cursorCondition,
          filterColumns({
            table,
            filters: input.filters as ExtendedColumnFilter<T>[],
            joinOperator: input.joinOperator ?? "and",
          }),
        )
      : and(
          cursorCondition,
          ...(searchConditions ?? []),
          input.createdAt.length > 0
            ? and(
                input.createdAt[0]
                  ? gte(
                      (table as Record<string, unknown>)["createdAt"] as SQL,
                      (() => {
                        const date = new Date(input.createdAt[0]);
                        date.setHours(0, 0, 0, 0);
                        return date.toISOString();
                      })(),
                    )
                  : undefined,
                input.createdAt[1]
                  ? lte(
                      (table as Record<string, unknown>)["createdAt"] as SQL,
                      (() => {
                        const date = new Date(input.createdAt[1]);
                        date.setHours(23, 59, 59, 999);
                        return date.toISOString();
                      })(),
                    )
                  : undefined,
              )
            : undefined,
          input.showDeleted
            ? isNotNull((table as Record<string, unknown>)["deletedAt"] as SQL)
            : isNull((table as Record<string, unknown>)["deletedAt"] as SQL),
        );

    // Add compound cursor for non-id sorts
    const orderBy = [
      input.sort.desc
        ? desc((table as Record<string, unknown>)[input.sort.id] as SQL)
        : asc((table as Record<string, unknown>)[input.sort.id] as SQL),
      // Secondary sort for stability
      asc((table as Record<string, unknown>)[cursorColumn] as SQL),
    ];

    const { data } = yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          // Fetch limit + 1 to determine if there are more results
          const data = await tx
            .select()
            // @ts-expect-error - Drizzle's .from() conditional type doesn't resolve with generics
            .from(table)
            .limit(input.limit + 1)
            .where(where)
            .orderBy(...orderBy);

          return { data };
        }),
      catch: (error) => {
        logError(
          errorContext.queryName,
          `Error fetching cursor paginated data`,
          {
            error,
            input,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorContext.errorMessage,
          cause: error,
        });
      },
    });

    // Check if there are more results
    const hasMore = data.length > input.limit;

    // Remove the extra item if it exists
    const items = hasMore ? data.slice(0, input.limit) : data;

    // Get the cursor for the next page (the ID of the last item)
    const nextCursor = hasMore
      ? ((items[items.length - 1] as Record<string, unknown>)[
          cursorColumn
        ] as string)
      : null;

    return {
      data: items,
      nextCursor,
      hasMore,
    };
  });
}
