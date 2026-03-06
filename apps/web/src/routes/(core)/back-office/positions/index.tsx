import getPositionsColumns from "@/components/columns/positions-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import positionSchema from "@tepian-k3/schema/platform/position.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";

export const Route = createFileRoute("/(core)/back-office/positions/")({
  validateSearch: positionSchema.getAllPositionsSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "positions.view",
    }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Jabatan"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: positions,
    isLoading,
    error,
  } = useQuery(
    trpc.platform.position.getPositionPaginated.queryOptions(params),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getPositionsColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: positions?.data ?? [],
    columns,
    pageCount: positions?.pageCount ?? 0,
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-row gap-2">
          <Checkbox
            id="show-deleted-position"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/positions",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label>Deleted Positions</Label>
        </div>
        <PermissionGate permission="positions.create">
          <Button
            onClick={() => navigate({ to: "/back-office/positions/create" })}
          >
            <PlusCircle className="size-4" />
            Tambah Position
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada posisi yang ditemukan"
        emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
