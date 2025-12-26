import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";
import { type AnyColumn } from "drizzle-orm";

export const timestamps = {
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
    mode: "string",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .$default(() => sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }),
};

/**
 * Allows a single database instance for multiple projects.
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

export function takeFirstOrNull<TData>(data: TData[]) {
  return data[0] ?? null;
}

export function takeFirstOrThrow<TData>(data: TData[], errorMessage?: string) {
  const first = takeFirstOrNull(data);

  if (!first) {
    throw new Error(errorMessage ?? "Item not found");
  }

  return first;
}

export function isEmpty<TColumn extends AnyColumn>(column: TColumn) {
  return sql<boolean>`
    case
      when ${column} is null then true
      when ${column} = '' then true
      when ${column}::text = '[]' then true
      when ${column}::text = '{}' then true
      else false
    end
  `;
}
