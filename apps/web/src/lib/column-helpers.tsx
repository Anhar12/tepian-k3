import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { Row } from "@tanstack/react-table";
import type { ColumnDef, ColumnMeta, RowData } from "@tanstack/react-table";
import type { FilterVariant } from "@tepian-k3/types/data-table.types";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { Text } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "./utils";

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends object
    ? T[K] extends unknown[]
      ? K
      : K | `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & string];

interface NumberColumnOptions {
  /** Width class (e.g., 'w-48', 'max-w-64') */
  width?: string;
}

/**
 * Creates a numbered row column (1, 2, 3...)
 */
export function createNumberColumn<T>(
  currentPage: number,
  perPage: number,
  options: NumberColumnOptions = {},
): ColumnDef<T> {
  const { width = "w-12" } = options;

  return {
    id: "no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="No" label="No" />
    ),
    cell: ({ row }) => (
      <div className={width}>{row.index + 1 + (currentPage - 1) * perPage}</div>
    ),
  };
}

interface TextColumnOptions {
  /** Width class (e.g., 'w-48', 'max-w-64') */
  width?: string;
  /** Enable column filtering */
  enableFilter?: boolean;
  /** Custom placeholder for filter */
  placeholder?: string;
  /** Filter variant */
  variant?: FilterVariant;
  /** Icon for the filter */
  icon?: LucideIcon;
}

/**
 * Creates a text column with optional truncation and filtering
 */
export function createTextColumn<T extends RowData>(
  id: Extract<NestedKeyOf<T>, string>,
  label: string,
  options: TextColumnOptions = {},
): ColumnDef<T> {
  const {
    width = "w-48",
    enableFilter = false,
    placeholder = `Cari ${label.toLowerCase()}...`,
    variant = "text",
    icon = Text,
  } = options;

  const meta: ColumnMeta<T, unknown> = enableFilter
    ? {
        label,
        placeholder,
        variant,
        icon,
      }
    : { label };

  return {
    id,
    accessorKey: id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={label} label={label} />
    ),
    cell: ({ row }) => (
      <div className={`${width} truncate`} title={row.getValue(id)}>
        {row.getValue(id)}
      </div>
    ),
    meta,
    enableColumnFilter: enableFilter,
  };
}

interface BadgeColumnOptions {
  /** Width class (e.g., 'w-48', 'max-w-64') */
  width?: string;
  /** Enable column filtering */
  enableFilter?: boolean;
  /** Custom placeholder for filter */
  placeholder?: string;
  /** Filter variant */
  variant?: FilterVariant;
  /** Icon for the filter */
  icon?: LucideIcon;
  /** Whether the badge value is boolean */
  valueIsBoolean?: boolean;
}

/**
 * Creates a badge column with consistent styling
 */
export function createBadgeColumn<T extends RowData>(
  id: Extract<NestedKeyOf<T>, string>,
  label: string,
  options: BadgeColumnOptions = {},
): ColumnDef<T> {
  const {
    width = "w-48",
    enableFilter = false,
    placeholder = `Cari ${label.toLowerCase()}...`,
    variant = "text",
    icon = Text,
    valueIsBoolean = false,
  } = options;

  const meta: ColumnMeta<T, string> = enableFilter
    ? {
        label,
        placeholder,
        variant,
        icon,
      }
    : { label };

  return {
    id,
    accessorKey: id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={label} label={label} />
    ),
    cell: ({ row }) => {
      let value: unknown;
      if (valueIsBoolean) {
        value = Boolean(row.getValue(id));
      } else {
        value = row.getValue(id);
      }

      return (
        <div className={width}>
          <Badge
            variant="secondary"
            className={cn(
              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
            )}
          >
            {String(value)}
          </Badge>
        </div>
      );
    },
    meta,
    enableColumnFilter: enableFilter,
  };
}

/**
 * Creates a price column with consistent formatting
 */
export function createPriceColumn<T extends RowData>(
  id: Extract<NestedKeyOf<T>, string>,
  label: string,
  options: TextColumnOptions = {},
): ColumnDef<T> {
  const {
    width = "w-48",
    enableFilter = false,
    placeholder = `Cari ${label.toLowerCase()}...`,
    variant = "text",
    icon = Text,
  } = options;

  const meta: ColumnMeta<T, unknown> = enableFilter
    ? {
        label,
        placeholder,
        variant,
        icon,
      }
    : { label };

  return {
    id,
    accessorKey: id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={label} label={label} />
    ),
    cell: ({ row }) => {
      const value = row.getValue(id);
      const formattedPrice = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(Number(value));
      return (
        <div className={`${width} truncate`} title={formattedPrice}>
          {formattedPrice}
        </div>
      );
    },
    meta,
    enableColumnFilter: enableFilter,
  };
}

interface DateColumnOptions {
  /** Whether the date can be null */
  nullable?: boolean;
  /** Date format string */
  format?: string;
}

/**
 * Creates a date column with consistent formatting
 */
export function createDateColumn<T extends RowData>(
  id: Extract<NestedKeyOf<T>, string>,
  label: string,
  options: DateColumnOptions = {},
): ColumnDef<T> {
  const { nullable = false, format: dateFormat = "dd/MM/yyyy HH:mm:ss" } =
    options;

  return {
    id,
    accessorKey: id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={label} label={label} />
    ),
    cell: ({ row }) => {
      const value = row.getValue(id);
      if (!value && nullable) return <span>-</span>;
      return <span>{format(new Date(value as string), dateFormat)}</span>;
    },
    meta: { label },
  };
}

/**
 * Creates an action column (header only, cell must be provided)
 */
export function createActionColumn<T>(
  cellRenderer: (props: { row: Row<T> }) => React.ReactNode,
): ColumnDef<T> {
  return {
    id: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aksi" label="Aksi" />
    ),
    cell: ({ row }) => cellRenderer({ row }),
  };
}
