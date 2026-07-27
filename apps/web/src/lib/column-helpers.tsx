import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { MaskedText } from "@/components/ui/masked-text";
import type {
  ColumnDef,
  ColumnMeta,
  Row,
  RowData,
} from "@tanstack/react-table";
import type { FilterVariant } from "@tepian-k3/types/data-table.types";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { Text } from "lucide-react";
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

interface TextColumnOptions<T> {
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
  /** Whether the text value is nullable */
  nullable?: boolean;
  /** Custom cell content renderer */
  cellRenderer?: (
    value: string | null | undefined,
    row: Row<T>,
  ) => React.ReactNode;
}

/**
 * Creates a text column with optional truncation and filtering
 */
export function createTextColumn<T extends RowData>(
  id: Extract<NestedKeyOf<T>, string>,
  label: string,
  options: TextColumnOptions<T> = {},
): ColumnDef<T> {
  const {
    width = "w-48",
    enableFilter = false,
    placeholder = `Cari ${label.toLowerCase()}...`,
    variant = "text",
    icon = Text,
    nullable = false,
    cellRenderer,
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
      const value = row.getValue(id) as string | null | undefined;
      if (cellRenderer) {
        return cellRenderer(value, row);
      }
      const displayValue = value ?? (nullable ? "-" : "");
      return (
        <div className={`${width} truncate`} title={displayValue}>
          {displayValue}
        </div>
      );
    },
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

interface StatusColumnOptions {
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
  /** Whether the status value is boolean */
  valueIsBoolean?: boolean;
  /** Mapping of status values to display text and badge colors */
  statusMap: Record<
    string,
    {
      text: string;
      color?: "green" | "red" | "blue" | "yellow" | "gray" | "custom";
      /* Optional custom colors for the badge (overrides color) using tailwind classes */
      customColors?: string;
    }
  >;
}

export function createStatusColumn<T extends RowData>(
  id: Extract<NestedKeyOf<T>, string>,
  label: string,
  options: StatusColumnOptions,
): ColumnDef<T> {
  const {
    width = "w-48",
    enableFilter = false,
    placeholder = `Cari ${label.toLowerCase()}...`,
    variant = "text",
    icon = Text,
    valueIsBoolean = false,
    statusMap,
  } = options;

  const meta: ColumnMeta<T, string> = enableFilter
    ? {
        label,
        placeholder,
        variant,
        icon,
        options: Object.entries(statusMap).map(([value, config]) => ({
          label: config.text,
          value,
        })),
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

      const status = statusMap[String(value)] || {
        text: String(value),
        color: "gray",
      };

      return (
        <div className={width}>
          <Badge
            variant="secondary"
            className={cn(
              status.color === "green" && "bg-green-100 text-green-800",
              status.color === "red" && "bg-red-100 text-red-800",
              status.color === "blue" && "bg-blue-100 text-blue-800",
              status.color === "yellow" && "bg-yellow-100 text-yellow-800",
              status.color === "gray" && "bg-gray-100 text-gray-800",
              status.customColors,
            )}
          >
            {status.text}
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
  options: TextColumnOptions<T> = {},
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
  const { nullable = false, format: dateFormat = "dd/MM/yyyy" } = options;

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

/**
 * Creates a compact date column
 */
export function createCompactDateColumn<T extends RowData>(
  id: Extract<NestedKeyOf<T>, string>,
  label: string,
  options: DateColumnOptions = {},
): ColumnDef<T> {
  const { nullable = false, format: dateFormat = "dd MMM yy" } = options;

  return {
    id,
    accessorKey: id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={label} label={label} />
    ),
    cell: ({ row }) => {
      const value = row.getValue(id);
      if (!value && nullable) return <span className="text-muted-foreground">-</span>;
      return <span className="text-xs whitespace-nowrap">{format(new Date(value as string), dateFormat)}</span>;
    },
    meta: { label },
  };
}

interface MergedTextColumnOptions<T> extends TextColumnOptions<T> {
  /** The secondary accessor key to display below the primary value */
  secondaryId: Extract<NestedKeyOf<T>, string>;
  /** Custom renderer for secondary value if needed */
  secondaryRenderer?: (
    value: unknown,
    row: Row<T>,
  ) => React.ReactNode;
  /** Apply masking to the secondary value */
  secondaryMaskType?: "email" | "phone" | "name" | "company";
}

/**
 * Creates a column that merges two text values (primary and secondary)
 */
export function createMergedTextColumn<T extends RowData>(
  id: Extract<NestedKeyOf<T>, string>,
  label: string,
  options: MergedTextColumnOptions<T>,
): ColumnDef<T> {
  const {
    width = "min-w-0",
    enableFilter = false,
    placeholder = `Cari ${label.toLowerCase()}...`,
    variant = "text",
    icon = Text,
    nullable = false,
    secondaryId,
    secondaryRenderer,
    secondaryMaskType,
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
      const primaryValue = row.getValue(id) as string | null | undefined;
      const displayPrimary = primaryValue ?? (nullable ? "-" : "");
      
      const secondaryValue = row.getValue(secondaryId);
      const stringVal = String(secondaryValue ?? (nullable ? "-" : ""));
      
      let secondaryContent: React.ReactNode;
      
      if (secondaryRenderer) {
        secondaryContent = secondaryRenderer(secondaryValue, row);
      } else if (secondaryMaskType) {
        secondaryContent = (
          <MaskedText 
            value={stringVal} 
            maskType={secondaryMaskType} 
            className="text-xs text-muted-foreground w-full"
          />
        );
      } else {
        secondaryContent = (
          <span className="text-xs text-muted-foreground truncate">
            {stringVal}
          </span>
        );
      }

      return (
        <div className={`flex flex-col ${width}`}>
          <span className="font-medium truncate">{displayPrimary}</span>
          {secondaryContent}
        </div>
      );
    },
    meta,
    enableColumnFilter: enableFilter,
  };
}
