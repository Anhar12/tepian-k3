import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";
import { type AnyColumn } from "drizzle-orm";
import type { DBType } from "./client";

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
  }).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
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

export async function generateOrderNumberWithSequence(
  db: DBType,
  prefix: string = "ORD"
): Promise<string> {
  // PostgreSQL sequences are atomic - handles race conditions automatically
  const result = await db.execute(
    sql`SELECT nextval('order_number_seq') as sequence`
  );

  const sequence = Number(result[0]?.sequence);

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${prefix}-${year}${month}${day}-${String(sequence).padStart(6, "0")}`;
}
