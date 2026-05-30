import getOrdersColumns from "@/components/columns/orders-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { authMeQueryOptions } from "@/utils/auth-query";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { OrderStatus, Role } from "@tepian-k3/constants";
import orderSchema from "@tepian-k3/schema/pengujian/order.schema";
import { useMemo } from "react";

/** Roles that are locked to a specific order status view. */
const ROLE_STATUS_LOCK: Partial<Record<Role, OrderStatus>> = {
  kaji_ulang: "kaji_ulang",
  koordinator_administrasi: "kaji_ulang",
  koordinator_pengujian: "kaji_ulang",
};

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

  const { data: me } = useQuery(authMeQueryOptions());

  const lockedStatus = useMemo<OrderStatus | undefined>(() => {
    const userRoles = me?.roles?.map((r) => r.name as Role) ?? [];
    for (const role of userRoles) {
      if (ROLE_STATUS_LOCK[role]) return ROLE_STATUS_LOCK[role];
    }
    return undefined;
  }, [me?.roles]);

  const effectiveParams = useMemo(
    () => (lockedStatus ? { ...params, status: lockedStatus } : params),
    [lockedStatus, params],
  );

  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery(
    trpc.pengujian.order.getAllOrdersPaginated.queryOptions(effectiveParams),
  );

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
          {lockedStatus ? (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {lockedStatus.replace(/_/g, " ")}
            </Badge>
          ) : (
            <Select
              value={params.status || "all"}
              onValueChange={(value) => {
                navigate({
                  to: "/back-office/orders",
                  search: {
                    ...params,
                    status:
                      value === "all" ? undefined : (value as OrderStatus),
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
          )}
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
