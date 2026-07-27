import getClustersColumns, { clusterActionConfig } from "@/components/columns/clusters-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clusterSchema from "@tepian-k3/schema/pengujian/cluster.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { SoftDeleteToggle } from "@/components/soft-delete-toggle";
import { useCrudRowActions, CrudRowActionsModal } from "@/components/crud-row-actions";
import type { Clusters } from "@tepian-k3/types/pengujian/clusters.types";

export const Route = createFileRoute("/(core)/back-office/clusters/")({
  validateSearch: clusterSchema.getAllClustersSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "clusters.view" }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Klaster"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: clusters,
    isLoading,
    error,
  } = useQuery(
    trpc.pengujian.cluster.getPaginatedClusters.queryOptions(params),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);
  
  const { selectedRow, isActionsOpen, setIsActionsOpen, handleRowClick } = useCrudRowActions<Clusters>();

  const columns = useMemo(
    () =>
      getClustersColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: (clusters?.data ?? []) as Clusters[],
    columns,
    pageCount: clusters?.pageCount ?? 0,
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
        <div className="flex flex-row gap-2 items-center">
          <SoftDeleteToggle
            checked={showDeleted ?? false}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/clusters",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
        </div>
        <PermissionGate permission="clusters.create">
          <Button
            onClick={() => navigate({ to: "/back-office/clusters/create" })}
          >
            <PlusCircle className="size-4" />
            Tambah Klaster
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada klaster ditemukan."
        emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
        onRowClick={handleRowClick}
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
      
      <CrudRowActionsModal
        config={clusterActionConfig}
        row={selectedRow}
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
      />
    </div>
  );
}
