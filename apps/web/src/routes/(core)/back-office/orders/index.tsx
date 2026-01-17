import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import getOrdersColumns from "@/components/columns/orders-columns";
import { useDataTable } from "@/hooks/use-data-table";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import orderSchema from "@tepian-k3/schema/order.schema";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/(core)/back-office/orders/")({
  validateSearch: (search) => orderSchema.getAllOrdersSchema.parse(search),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "orders.read" }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery(trpc.order.getAllOrdersPaginated.queryOptions(params));

  const columns = useMemo(
    () =>
      getOrdersColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTable({
    data: ordersData?.data ?? [],
    columns,
    pageCount: ordersData?.pagination.totalPages ?? 0,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: {
        pageSize: params.perPage,
        pageIndex: params.page - 1,
      },
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-row items-center gap-2">
          <Label className="whitespace-nowrap">Filter Status:</Label>
          <Select
            value={params.status || "all"}
            onValueChange={(value) => {
              navigate({
                to: "/back-office/orders",
                search: {
                  ...params,
                  status: value === "all" ? undefined : (value as any),
                  page: 1,
                },
              });
            }}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
              <SelectItem value="in_progress">Dalam Proses</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {ordersData && (
          <div className="text-sm text-muted-foreground">
            Total: {ordersData.pagination.totalItems} order
          </div>
        )}
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada order ditemukan."
        emptyDescription="Belum ada order yang dibuat oleh pelanggan."
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
