import {
  flexRender,
  type Column,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import type * as React from "react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { getCommonPinningStyles } from "@tepian-k3/utils/data-table";

import { cn } from "@/lib/utils";
import { IconAlertCircle } from "@tabler/icons-react";

import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@tepian-k3/api/root";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  isLoading?: boolean;
  error?: TRPCClientErrorLike<AppRouter> | null;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (row: TData) => void;
}

function getPinningStyles<TData>(column: Column<TData>) {
  const isPinned = column.getIsPinned();

  if (!isPinned) {
    return {};
  }

  return getCommonPinningStyles({
    column,
  });
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  isLoading = false,
  error = null,
  emptyMessage = "Tidak ada data ditemukan.",
  emptyDescription = "Coba sesuaikan filter atau kata kunci pencarian Anda.",
  onRowClick,
  ...props
}: DataTableProps<TData>) {
  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <div
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
      {...props}
    >
      {children}

      <div className="overflow-hidden rounded-[18px] border bg-white">
        <Table>
          {/* =========================
              TABLE HEADER
          ========================= */}

          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b bg-slate-100">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={getPinningStyles(header.column)}
                    className="h-10 bg-slate-100 px-4 text-sm font-semibold text-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          {/* =========================
              TABLE BODY
          ========================= */}

          <TableBody className="bg-white">
            {/* =========================
                LOADING
            ========================= */}

            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow
                  key={index}
                  className="border-0 bg-white hover:bg-white"
                >
                  {Array.from({
                    length: columnCount,
                  }).map((_, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className="h-12 border-0 bg-white px-4 py-2"
                    >
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : /* =========================
                  ERROR
              ========================= */
            error ? (
              <TableRow className="border-0 bg-white hover:bg-white">
                <TableCell
                  colSpan={columnCount}
                  className="h-64 border-0 bg-white"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <IconAlertCircle className="size-8 text-destructive" />

                    <div>
                      <p className="font-medium">
                        {error.data?.code ?? "Terjadi Kesalahan"}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {error.message}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : /* =========================
                  DATA
              ========================= */
            table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(event) => {
                    if (!onRowClick) return;

                    const target = event.target as HTMLElement;

                    const isInteractive = target.closest(
                      [
                        "button",
                        "a",
                        "input",
                        "textarea",
                        "select",
                        "[role='checkbox']",
                        "[role='menuitem']",
                        "[role='option']",
                      ].join(", "),
                    );

                    if (isInteractive) return;

                    onRowClick(row.original);
                  }}
                  className={cn(
                    "border-b bg-white transition-colors hover:bg-muted/30",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={getPinningStyles(cell.column)}
                      className="h-12 border-0 bg-white px-4 py-2"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              /* =========================
                  EMPTY STATE
              ========================= */
              <TableRow className="border-0 bg-white hover:bg-white">
                <TableCell
                  colSpan={columnCount}
                  className="h-64 border-0 bg-white"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <IconAlertCircle className="size-8 text-muted-foreground" />

                    <div>
                      <p className="font-medium">{emptyMessage}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {emptyDescription}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* =========================
          PAGINATION
      ========================= */}

      <div className="flex flex-col gap-3">
        <DataTablePagination table={table} />

        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
