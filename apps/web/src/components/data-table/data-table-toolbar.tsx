import type { Column, Table } from "@tanstack/react-table";

import * as React from "react";

import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  rightActions?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  rightActions,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const textColumns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            column.getCanFilter() && column.columnDef.meta?.variant === "text",
        ),
    [table],
  );

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-center justify-between gap-3",
        className,
      )}
      {...props}
    >
      {/* Search */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {textColumns.map((column) => (
          <DataTableToolbarTextFilter key={column.id} column={column} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <DataTableViewOptions table={table} align="end" />

        {rightActions}
      </div>
    </div>
  );
}

interface DataTableToolbarTextFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarTextFilter<TData>({
  column,
}: DataTableToolbarTextFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;

  return (
    <div className="relative w-full max-w-[340px]">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        placeholder={columnMeta?.placeholder ?? columnMeta?.label ?? "Cari"}
        value={(column.getFilterValue() as string) ?? ""}
        onChange={(event) => column.setFilterValue(event.target.value)}
        className="h-9 w-full pl-9"
      />
    </div>
  );
}
