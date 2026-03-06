import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Label } from "@/components/ui/label";
import getOrdersColumns from "@/components/columns/orders-columns";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import orderSchema from "@tepian-k3/schema/pengujian/order.schema";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderStatus } from "@tepian-k3/constants";
import { useDataTableRouter } from "@/hooks/use-data-table-router";

export const Route = createFileRoute("/(core)/back-office/orders/")({
  validateSearch: orderSchema.getAllOrdersSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "orders.view" }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Pesanan"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery(trpc.pengujian.order.getAllOrdersPaginated.queryOptions(params));

  const columns = useMemo(
    () =>
      getOrdersColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: ordersData?.data ?? [],
    columns,
    pageCount: ordersData?.pageCount ?? 0,
    search: params,
    navigate: ({ search: updater }) => {
      navigate({ search: updater });
    },
    initialState: {
      sorting: [{ id: "createdAt", desc: false }],
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
                  status: value === "all" ? undefined : (value as OrderStatus),
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
              <SelectItem value="kaji_ulang">Kaji Ulang</SelectItem>
              <SelectItem value="kaji_ulang_disetujui">
                Kaji Ulang Disetujui
              </SelectItem>
              <SelectItem value="penawaran_diterbitkan">
                Penawaran Diterbitkan
              </SelectItem>
              <SelectItem value="revision">Revisi</SelectItem>
              <SelectItem value="persetujuan_disetujui">
                Persetujuan Disetujui
              </SelectItem>
              <SelectItem value="tagihan_diterbitkan">
                Tagihan Diterbitkan
              </SelectItem>
              <SelectItem value="pembayaran_diterima">
                Pembayaran Diterima
              </SelectItem>
              <SelectItem value="proses_pengambilan_sampel">
                Proses Pengambilan Sampel
              </SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {ordersData && (
          <div className="text-sm text-muted-foreground">
            Halaman {params.page} dari {ordersData.pageCount}
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
