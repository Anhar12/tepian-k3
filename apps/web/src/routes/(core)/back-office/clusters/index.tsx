import getClustersColumns from "@/components/columns/clusters-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDataTable } from "@/hooks/use-data-table";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clusterSchema from "@tepian-k3/schema/cluster.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(core)/back-office/clusters/")({
  validateSearch: clusterSchema.getAllClustersSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "clusters.view" }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: clusters,
    isLoading,
    error,
  } = useQuery(trpc.cluster.getPaginatedClusters.queryOptions(params));

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getClustersColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTable({
    data: clusters?.data ?? [],
    columns,
    pageCount: clusters?.pageCount ?? 0,
    initialState: {
      sorting: [{ id: "createdAt", desc: false }],
      pagination: {
        pageSize: params.perPage,
        pageIndex: params.page - 1,
      },
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-row gap-2">
          <Checkbox
            id="show-deleted-clusters"
            checked={showDeleted}
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
          <Label>Deleted Clusters</Label>
        </div>
        <PermissionGate permission="clusters.create">
          <Button
            onClick={() => navigate({ to: "/back-office/clusters/create" })}
          >
            <PlusCircle className="size-4" />
            Tambah Cluster
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada cluster ditemukan."
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
