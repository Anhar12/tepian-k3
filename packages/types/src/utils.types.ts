import type { Exact } from "type-fest";

import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from "@tepian-k3/db/index";
import type * as relations from "@tepian-k3/db/relations";
import type * as schema from "@tepian-k3/db/schema";

export type StringWithAutocompleteOptions<TOptions> = (string & {}) | TOptions;

type Schema = typeof schema;
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
  QBConfig extends Exact<QueryConfig<TableName>, QBConfig> = object
> = BuildQueryResult<
  TablesWithRelations,
  TablesWithRelations[TableName],
  QBConfig
>;
