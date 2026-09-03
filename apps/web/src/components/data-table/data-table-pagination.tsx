import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;

  const totalRows = table.getFilteredRowModel().rows.length;

  const pageIndex = table.getState().pagination.pageIndex;

  const pageCount = table.getPageCount();

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 px-2 py-1",
        "lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
      {...props}
    >
      {/* Selected */}
      <div className="text-sm font-medium text-slate-500">
        <span className="font-semibold text-slate-700">{selectedRows}</span>{" "}
        dari <span className="font-semibold text-slate-700">{totalRows}</span>{" "}
        baris dipilih.
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-8">
        {/* Rows Per Page */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium whitespace-nowrap">
            Baris per halaman
          </span>

          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-9 w-[78px] rounded-lg">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>

            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page Info */}
        <div className="text-sm font-medium whitespace-nowrap">
          Halaman {pageIndex + 1} dari {pageCount}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            aria-label="Halaman sebelumnya"
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-sm font-medium">
            {pageIndex + 1}
          </div>

          <Button
            aria-label="Halaman berikutnya"
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
