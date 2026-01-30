import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

interface TableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

export function TableSkeleton({
  columnCount = 5,
  rowCount = 10,
}: TableSkeletonProps = {}) {
  return (
    <DataTableSkeleton
      columnCount={columnCount}
      rowCount={rowCount}
      withPagination
      withViewOptions
    />
  );
}
