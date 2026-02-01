import { sql } from "drizzle-orm";
import { text, timestamp } from "drizzle-orm/pg-core";
import { type AnyColumn } from "drizzle-orm";
import type { DBType } from "./client";
import {
  ORDER_SEQUENCE_NAME,
  TESTING_SEQUENCE_NAME,
} from "@tepian-k3/constants";

export const timestamps = {
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
    mode: "string",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
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

// ...existing code...

/**
 * Generic function to generate sequential numbers with date prefix
 * @param db - Database instance
 * @param sequenceName - Name of the PostgreSQL sequence
 * @param prefix - Prefix for the generated number (e.g., 'TEST', 'ORD')
 * @param padLength - Length to pad the sequence number (default: 6)
 * @returns Generated number in format: PREFIX-YYYYMMDD-NNNNNN
 */
export async function generateSequentialNumber(
  db: DBType,
  sequenceName: string,
  prefix: string,
  padLength: number = 6,
): Promise<string> {
  // PostgreSQL sequences are atomic - handles race conditions automatically
  const [result] = await db.execute(
    sql`SELECT nextval('${sql.raw(sequenceName)}')`,
  );

  if (!result || result.nextval === undefined) {
    throw new Error(
      `Failed to retrieve next value from sequence: ${sequenceName}`,
    );
  }

  const sequence = Number(result.nextval);

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${prefix}-${year}${month}${day}-${String(sequence).padStart(
    padLength,
    "0",
  )}`;
}

// Refactor existing functions to use the generic one
export async function generateTestingNumberWithSequence(
  db: DBType,
  prefix: string = "TEST",
): Promise<string> {
  return generateSequentialNumber(db, TESTING_SEQUENCE_NAME, prefix);
}

export async function generateOrderNumberWithSequence(
  db: DBType,
  prefix: string = "ORD",
): Promise<string> {
  return generateSequentialNumber(db, ORDER_SEQUENCE_NAME, prefix);
}

/**
 * Converts camelCase to snake_case
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the string
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Creates a key-value for file upload columns
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with only url column
 */
export function createFileUrlColumn<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`),
  } as Record<`${T}Url`, ReturnType<typeof text>>;
}

/**
 * Creates a key-value for NOT NULL file upload columns
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with only NOT NULL url column
 */
export function createRequiredFileUrlColumn<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`).notNull(),
  } as Record<`${T}Url`, ReturnType<typeof text>>;
}

/**
 * Creates a pair of columns for file uploads (fileName and url)
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with fileName and url columns
 */
export function createFileColumns<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}FileName`]: text(`${snakeCase}_file_name`),
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`),
  } as Record<`${T}FileName` | `${T}Url`, ReturnType<typeof text>>;
}

/** * Creates a pair of NOT NULL columns for file uploads (fileName and url)
 * @param columnPrefix - The prefix for the column names in camelCase (e.g., 'offeringDocument', 'profilePicture')
 * @returns Object with NOT NULL fileName and url columns
 */
export function createRequiredFileColumns<T extends string>(columnPrefix: T) {
  const snakeCase = toSnakeCase(columnPrefix);
  return {
    [`${columnPrefix}FileName`]: text(`${snakeCase}_file_name`).notNull(),
    [`${columnPrefix}Url`]: text(`${snakeCase}_url`).notNull(),
  } as Record<`${T}FileName` | `${T}Url`, ReturnType<typeof text>>;
}
