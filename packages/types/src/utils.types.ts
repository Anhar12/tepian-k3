import type { Exact } from "type-fest";

import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
  InferSelectModel,
  Many,
} from "@tepian-k3/db";
import type * as relations from "@tepian-k3/db/relations";
import type * as schema from "@tepian-k3/db/schema";

export type StringWithAutocompleteOptions<TOptions> = (string & {}) | TOptions;

export type Schema = typeof schema;
type Relations = typeof relations;
type SchemaAndRelations = Schema & Relations;
type TablesWithRelations = ExtractTablesWithRelations<SchemaAndRelations>;

type QueryConfig<TableName extends keyof TablesWithRelations> = DBQueryConfig<
  "one" | "many",
  boolean,
  TablesWithRelations,
  TablesWithRelations[TableName]
>;

export type InferQueryModel<
  TableName extends keyof TablesWithRelations,
  QBConfig extends Exact<QueryConfig<TableName>, QBConfig> = object,
> = BuildQueryResult<
  TablesWithRelations,
  TablesWithRelations[TableName],
  QBConfig
>;

// Helper type to find the tsName corresponding to a given dbName in TSchema
type FindTsNameByDbName<
  TSchema extends Record<string, any>,
  TDbNameToFind extends string,
> = {
  [K in keyof ExtractTablesWithRelations<TSchema>]: ExtractTablesWithRelations<TSchema>[K] extends {
    dbName: TDbNameToFind;
  }
    ? K
    : never;
}[keyof ExtractTablesWithRelations<TSchema>];

// Helper type to find the dbName corresponding to a given tsName in TSchema
type FindDbNameByTsName<
  TSchema extends Record<string, any>,
  TTable extends TSchema[keyof TSchema],
> = {
  [K in keyof TSchema]: TSchema[K] extends TTable ? K : never;
}[keyof TSchema];

/**
 * Utility type to infer the model type for a given table name from the schema.
 * Handles nested relations recursively.
 * Uses referencedTableName (dbName) and FindTsNameByDbName helper.
 */
export type ModelWithRelationsFromName<
  TSchema extends Record<string, any>,
  TTableName extends keyof ExtractTablesWithRelations<TSchema>,
> = InferSelectModel<TSchema[TTableName]> & {
  [K in keyof ExtractTablesWithRelations<TSchema>[TTableName]["relations"]]?: ExtractTablesWithRelations<TSchema>[TTableName]["relations"][K] extends infer TRelation
    ? TRelation extends { referencedTableName: infer TRefDbName extends string }
      ? FindTsNameByDbName<TSchema, TRefDbName> extends infer TRefTsName extends
          keyof ExtractTablesWithRelations<TSchema>
        ? TRelation extends Many<any>
          ? ModelWithRelationsFromName<TSchema, TRefTsName>[]
          : ModelWithRelationsFromName<TSchema, TRefTsName> | null
        : never
      : never
    : never;
};

/**
 * Utility type to infer the model type for a given table from the schema.
 * Handles nested relations recursively.
 * Uses referencedTableName (dbName) and FindDbNameByTsName helper.
 */
export type ModelWithRelations<
  TSchema extends Record<string, any>,
  TTable extends TSchema[keyof TSchema],
> =
  FindDbNameByTsName<TSchema, TTable> extends infer TTableName extends
    keyof ExtractTablesWithRelations<TSchema>
    ? ModelWithRelationsFromName<TSchema, TTableName>
    : never;
