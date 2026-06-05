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
import type { OrderStatus, Role, WorksheetStatus } from "@tepian-k3/constants";
import orderSchema from "@tepian-k3/schema/pengujian/order.schema";
import { useMemo } from "react";

/** A role-locked orders view: filter by order status and/or worksheet status. */
interface RoleLock {
  /** Lock to orders whose own status is one of these. */
  statuses?: OrderStatus[];
  /** Lock to orders whose associated worksheet status is one of these. */
  worksheetStatuses?: WorksheetStatus[];
}

/**
 * Roles that are locked to a specific orders view.
 *
 * Coordinators verify worksheets, so they should only see orders once Kaji
 * Ulang has pressed "Ajukan Verifikasi" (worksheet → `pending_verification`).
 * The order status stays `kaji_ulang` throughout that sub-flow, so coordinators
 * are gated on worksheet status rather than order status. Kaji Ulang keeps the
 * order-status lock so it still sees its own drafts.
 *
 * Tim Penjadwalan only sees orders once Bendahara Penerimaan has validated the
 * payment (verifyPayment → `menunggu_penerbitan_spt_jadwal`), i.e. the orders
 * now awaiting SPT issuance and scheduling.
 */
const ROLE_STATUS_LOCK: Partial<Record<Role, RoleLock>> = {
  kaji_ulang: { statuses: ["kaji_ulang", "revision"] },
  koordinator_administrasi: { worksheetStatuses: ["verified"] },
  koordinator_pengujian: { worksheetStatuses: ["pending_verification"] },
  tim_penjadwalan: { statuses: ["menunggu_penerbitan_spt_jadwal"] },
  kepala_balai: { statuses: ["kaji_ulang_disetujui"] },
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

  const lock = useMemo<RoleLock | undefined>(() => {
    const userRoles = me?.roles?.map((r) => r.name as Role) ?? [];
    for (const role of userRoles) {
      if (ROLE_STATUS_LOCK[role]) return ROLE_STATUS_LOCK[role];
    }
    return undefined;
  }, [me?.roles]);

  /** Human-readable chips for the active lock (order + worksheet statuses). */
  const lockedLabels = useMemo<string[] | undefined>(() => {
    if (!lock) return undefined;
    const values = [
      ...(lock.statuses ?? []),
      ...(lock.worksheetStatuses ?? []),
    ];
    return values.length > 0
      ? values.map((s) => s.replace(/_/g, " "))
      : undefined;
  }, [lock]);

  const effectiveParams = useMemo(
    () =>
      lock
        ? {
            ...params,
            status: undefined,
            statuses: lock.statuses,
            worksheetStatuses: lock.worksheetStatuses,
          }
        : params,
    [lock, params],
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
          {lockedLabels ? (
            <div className="flex flex-wrap gap-1.5">
              {lockedLabels.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700"
                >
                  {label}
                </Badge>
              ))}
            </div>
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
