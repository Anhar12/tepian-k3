import type { ColumnSort, Row, RowData } from "@tanstack/react-table";
import type {
  FilterItemSchema,
  FilterVariant,
  JoinOperator,
} from "@tepian-k3/shared/data-table.config";

export {
  dataTableConfig,
  type DataTableConfig,
  type FilterOperator,
  type FilterVariant,
  type JoinOperator,
  type FilterItemSchema,
} from "@tepian-k3/shared/data-table.config";

declare module "@tanstack/react-table" {
  // biome-ignore lint/correctness/noUnusedVariables: TData is used in the TableMeta interface
  interface TableMeta<TData extends RowData> {
    queryKeys?: QueryKeys;
    filters?: ExtendedColumnFilter<TData>[];
    setFilters?: (
      filters:
        | ExtendedColumnFilter<TData>[]
        | ((
            prev: ExtendedColumnFilter<TData>[],
          ) => ExtendedColumnFilter<TData>[])
        | null,
    ) => void;
    joinOperator?: JoinOperator;
    setJoinOperator?: (value: JoinOperator) => void;
  }

  // eslint-disable-next-line unused-imports/no-unused-vars -- TData and TValue required by @tanstack/react-table module augmentation
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  }
}

export interface QueryKeys {
  page: string;
  perPage: string;
  sort: string;
  filters: string;
  joinOperator: string;
}

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  variant: "update" | "delete";
}
