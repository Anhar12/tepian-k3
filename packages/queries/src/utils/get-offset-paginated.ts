import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import {
  and,
  asc,
  count,
  desc,
  gte,
  isNotNull,
  isNull,
  lte,
  type SQL,
  type Table,
} from "@tepian-k3/db";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import type { JoinOperator } from "@tepian-k3/types/data-table.types";

interface PaginatedInput {
  page: number;
  perPage: number;
  sort: { id: string; desc: boolean }[];
  filters: unknown[];
  joinOperator: JoinOperator;
  showDeleted: boolean;
  createdAt: number[];
}

interface GetOffsetPaginatedOptions<T extends Table> {
  table: T;
  input: PaginatedInput;
  /** Additional where conditions for simple (non-advanced) filtering (e.g. ilike on name) */
  searchConditions?: (SQL | undefined)[];
  errorContext: {
    queryName: string;
    errorMessage: string;
  };
}

export function getOffsetPaginated<T extends Table>({
  table,
  input,
  searchConditions,
  errorContext,
}: GetOffsetPaginatedOptions<T>) {
  return Effect.gen(function* () {
    const offset = (input.page - 1) * input.perPage;
    const advancedTable = input.filters && input.filters.length > 0;

    const where = advancedTable
      ? filterColumns({
          table,
          filters: input.filters as ExtendedColumnFilter<T>[],
          joinOperator: input.joinOperator ?? "and",
        })
      : and(
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

    const orderBy =
      input.sort.length > 0
        ? input.sort.map((item) =>
            item.desc
              ? desc((table as Record<string, unknown>)[item.id] as SQL)
              : asc((table as Record<string, unknown>)[item.id] as SQL),
          )
        : [desc((table as Record<string, unknown>)["createdAt"] as SQL)];

    const { data, total } = yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const data = await tx
            .select()
            // @ts-expect-error - Drizzle's .from() conditional type doesn't resolve with generics
            .from(table)
            .limit(input.perPage)
            .offset(offset)
            .where(where)
            .orderBy(...orderBy);

          const total = await tx
            .select({
              count: count(),
            })
            // @ts-expect-error - Drizzle's .from() conditional type doesn't resolve with generics
            .from(table)
            .where(where)
            .execute()
            .then((res) => res[0]?.count ?? 0);

          return { data, total };
        }),
      catch: (error) => {
        logError(errorContext.queryName, `Error fetching paginated data`, {
          error,
          input,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorContext.errorMessage,
          cause: error,
        });
      },
    });

    const pageCount = Math.ceil(total / input.perPage);

    return {
      data,
      pageCount,
    };
  });
}
